/**
 * Host half of the `dsh-record` plugin: a multi-level alert record library.
 *
 * The plugin stores directories, templates, records, and uploaded media through
 * one of two modes:
 * - the Database connections plugin is installed: PostgreSQL tables and MinIO
 *   objects, streamed through this plugin's authenticated Fetch routes;
 * - it is absent: one atomically written JSON file and media files under the
 *   plugin's local directory.
 *
 * Once the database plugin is installed its PostgreSQL path owns the data. A
 * failing pool returns 503 instead of silently switching to local files.
 *
 * @module dsh-record
 */

import { createReadStream } from 'node:fs'
import { mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { randomBytes, randomUUID } from 'node:crypto'
import { dirname, extname, join } from 'node:path'
import { homedir } from 'node:os'
import { Service } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import z from '@deepseek-ai/schemastery'

/** Shared API prefix owned by this plugin. */
const API = '/api/record'
/** Local fallback file below the plugin base directory. */
const DATA_FILE = 'data.json'
/** Local media directory below the plugin base directory. */
const MEDIA_DIR = 'media'
/** MinIO object key prefix for uploaded media. */
const MEDIA_KEY_PREFIX = 'dsh-record/media'
/** Anonymous uploads older than this are deleted while uploading. */
const ANONYMOUS_TTL_MS = 24 * 60 * 60 * 1000
const MAX_ID = 128
const MAX_DIRECTORY_NAME = 120
const MAX_TEMPLATE_NAME = 120
const MAX_DESCRIPTION = 4000
const MAX_FIELD_LABEL = 60
const MAX_FIELD_UNIT = 20
const MAX_FIELDS = 40
const MAX_TITLE = 160
const MAX_NOTE = 4000
const MAX_FILE_NAME = 255
const MAX_FIELD_KEY = 64
const DEFAULT_LIMIT = 100
const MAX_LIMIT = 500
const DEFAULT_UPLOAD_MB = 200
const FIELD_TYPES = ['number', 'text', 'image', 'video', 'audio']
const MEDIA_KINDS = new Set(['image', 'video', 'audio'])
const SEVERITIES = ['', 'low', 'medium', 'high', 'critical']
const NODE_TABLE = 'dsh_alert_nodes'
const TEMPLATE_TABLE = 'dsh_alert_templates'
const RECORD_TABLE = 'dsh_alert_records'
const FILE_TABLE = 'dsh_alert_files'
const CONTENT_TYPE_EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/bmp': '.bmp',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/ogg': '.ogg',
  'audio/webm': '.weba',
}

/**
 * The plugin's editable settings.
 */
export const Config = z.object({
  localDir: z.string().default('').description(
    'Local storage directory for the JSON fallback and media files; empty uses $DSH_HOME/dsh-record',
  ),
  maxUploadMb: z.number().min(1).max(4096).default(DEFAULT_UPLOAD_MB).description(
    'Maximum size of one uploaded file in megabytes',
  ),
})

/** A failure mapped to one HTTP response and one actionable message. */
class AlertError extends Error {
  /**
   * @param code - machine-readable error code consumed by the page.
   * @param message - actionable message shown by the page.
   * @param status - HTTP status for the Fetch route.
   */
  constructor(code, message, status) {
    super(message)
    this.name = 'AlertError'
    this.code = code
    this.status = status
  }
}

/** @returns true for a plain JSON object. */
function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** @returns a readable message for any thrown value. */
function messageOf(error) {
  return error instanceof Error ? error.message : String(error)
}

/** @returns true when the filesystem error means the path does not exist. */
function isMissingFile(error) {
  return isRecord(error) && error.code === 'ENOENT'
}

/** @returns a trimmed required string, or a 400 error. */
function requiredText(value, field, max) {
  if (typeof value !== 'string') throw new AlertError('invalid-input', `${field} is required`, 400)
  const text = value.trim()
  if (text === '') throw new AlertError('invalid-input', `${field} is required`, 400)
  if (text.length > max) throw new AlertError('invalid-input', `${field} is too long`, 400)
  return text
}

/** @returns a trimmed optional string, or a 400 error when over the limit. */
function optionalText(value, field, max) {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') throw new AlertError('invalid-input', `${field} must be text`, 400)
  const text = value.trim()
  if (text.length > max) throw new AlertError('invalid-input', `${field} is too long`, 400)
  return text
}

/** @returns a trimmed opaque id, or a 400 error. */
function normalizeId(value, field) {
  if (typeof value !== 'string') throw new AlertError('invalid-input', `${field} is required`, 400)
  const id = value.trim()
  if (id === '') throw new AlertError('invalid-input', `${field} is required`, 400)
  if (id.length > MAX_ID) throw new AlertError('invalid-input', `${field} is too long`, 400)
  return id
}

/** @returns a normalized parent directory id, or null for the root. */
function normalizeParentId(value) {
  if (value === undefined || value === null || value === '') return null
  return normalizeId(value, 'Parent directory id')
}

/** @returns one of the accepted severity values, or a 400 error. */
function normalizeSeverity(value) {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') throw new AlertError('invalid-input', 'Severity must be text', 400)
  const severity = value.trim()
  if (!SEVERITIES.includes(severity)) {
    throw new AlertError('invalid-input', 'Severity must be one of low, medium, high, or critical', 400)
  }
  return severity
}

/** @returns an ISO timestamp, defaulting to now. */
function normalizeOccurredAt(value) {
  if (value === undefined || value === null || value === '') return new Date().toISOString()
  if (typeof value !== 'string') throw new AlertError('invalid-input', 'Occurred time must be an ISO timestamp', 400)
  const time = Date.parse(value)
  if (Number.isNaN(time)) throw new AlertError('invalid-input', 'Occurred time must be an ISO timestamp', 400)
  return new Date(time).toISOString()
}

/** @returns a query limit bounded by the maximum page size. */
function normalizeLimit(value, fallback, max) {
  if (value === undefined || value === null || value === '') return fallback
  const number = typeof value === 'string' ? Number(value) : value
  if (typeof number !== 'number' || !Number.isInteger(number) || number < 1) {
    throw new AlertError('invalid-input', 'Limit must be a positive integer', 400)
  }
  return Math.min(number, max)
}

/** @returns a non-negative query offset. */
function normalizeOffset(value) {
  if (value === undefined || value === null || value === '') return 0
  const number = typeof value === 'string' ? Number(value) : value
  if (typeof number !== 'number' || !Number.isInteger(number) || number < 0) {
    throw new AlertError('invalid-input', 'Offset must be zero or a positive integer', 400)
  }
  return number
}

/** @returns a new template field key. */
function newFieldKey() {
  return `f_${randomBytes(4).toString('hex')}`
}

/** @returns one timestamp as an ISO string. */
function isoOf(value) {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string' && value !== '') {
    const time = Date.parse(value)
    return Number.isNaN(time) ? value : new Date(time).toISOString()
  }
  return ''
}

/** @returns a JSON object or array column, tolerating a text-encoded value. */
function jsonColumn(value, fallback) {
  if (isRecord(value) || Array.isArray(value)) return value
  if (typeof value === 'string' && value !== '') {
    try {
      return JSON.parse(value)
    } catch (_invalidJson) {
      return fallback
    }
  }
  return fallback
}

/** @returns one stored field with defaults applied. */
function normalizeStoredField(value) {
  if (!isRecord(value)) {
    return { key: '', label: '', type: 'text', unit: '', required: false }
  }
  return {
    key: typeof value.key === 'string' ? value.key : '',
    label: typeof value.label === 'string' ? value.label : '',
    type: FIELD_TYPES.includes(value.type) ? value.type : 'text',
    unit: typeof value.unit === 'string' ? value.unit : '',
    required: value.required === true,
  }
}

/** @returns one stored directory with defaults applied. */
function normalizeNode(value) {
  return {
    id: String(value.id ?? ''),
    parentId: value.parentId === null || value.parentId === undefined || value.parentId === '' ? null : String(value.parentId),
    name: String(value.name ?? ''),
    description: typeof value.description === 'string' ? value.description : '',
    createdAt: isoOf(value.createdAt),
    updatedAt: isoOf(value.updatedAt),
  }
}

/** @returns one stored template with defaults applied. */
function normalizeTemplate(value) {
  return {
    id: String(value.id ?? ''),
    nodeId: String(value.nodeId ?? ''),
    name: String(value.name ?? ''),
    description: typeof value.description === 'string' ? value.description : '',
    fields: Array.isArray(value.fields) ? value.fields.filter(isRecord).map(normalizeStoredField) : [],
    createdAt: isoOf(value.createdAt),
    updatedAt: isoOf(value.updatedAt),
  }
}

/** @returns one stored record with defaults applied. */
function normalizeRecord(value) {
  return {
    id: String(value.id ?? ''),
    nodeId: String(value.nodeId ?? ''),
    templateId: String(value.templateId ?? ''),
    title: String(value.title ?? ''),
    severity: typeof value.severity === 'string' ? value.severity : '',
    occurredAt: isoOf(value.occurredAt),
    note: typeof value.note === 'string' ? value.note : '',
    values: jsonColumn(value.values, {}),
    createdAt: isoOf(value.createdAt),
    updatedAt: isoOf(value.updatedAt),
  }
}

/** @returns one stored file with defaults applied. */
function normalizeFile(value) {
  const contentType = typeof value.contentType === 'string' && value.contentType !== ''
    ? value.contentType
    : 'application/octet-stream'
  return {
    id: String(value.id ?? ''),
    recordId: typeof value.recordId === 'string' ? value.recordId : '',
    fieldKey: typeof value.fieldKey === 'string' ? value.fieldKey : '',
    kind: MEDIA_KINDS.has(value.kind) ? value.kind : kindOfContentType(contentType),
    name: String(value.name ?? ''),
    contentType,
    sizeBytes: Number.isFinite(Number(value.sizeBytes)) ? Number(value.sizeBytes) : 0,
    storage: value.storage === 'minio' ? 'minio' : 'local',
    objectKey: typeof value.objectKey === 'string' ? value.objectKey : '',
    localPath: typeof value.localPath === 'string' ? value.localPath : '',
    createdAt: isoOf(value.createdAt),
  }
}

/** @returns the plugin base directory that owns the fallback data and media. */
function baseDirOf(config) {
  const localDir = typeof config.localDir === 'string' ? config.localDir.trim() : ''
  if (localDir !== '') return localDir
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'dsh-record')
}

/** @returns the local JSON fallback file. */
function localDataFile(config) {
  return join(baseDirOf(config), DATA_FILE)
}

/** @returns the optional database service from the Database connections plugin. */
function databaseOf(ctx) {
  const database = ctx.get('database')
  if (database === undefined || typeof database.query !== 'function' || typeof database.withMinio !== 'function') {
    return undefined
  }
  return database
}

/** @returns the media kind derived from a content type. */
function kindOfContentType(contentType) {
  const type = String(contentType).split(';')[0].trim().toLowerCase()
  if (type.startsWith('image/')) return 'image'
  if (type.startsWith('video/')) return 'video'
  if (type.startsWith('audio/')) return 'audio'
  return 'file'
}

/** @returns a normalized media type, falling back to a generic binary type. */
function normalizeContentType(value) {
  if (typeof value !== 'string') return 'application/octet-stream'
  const type = value.split(';')[0].trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/.test(type)) return 'application/octet-stream'
  return type
}

/** @returns a safe file extension for a local media path. */
function extensionOf(name, contentType) {
  const fromName = extname(typeof name === 'string' ? name : '').toLowerCase()
  if (/^\.[a-z0-9]{1,10}$/.test(fromName)) return fromName
  return CONTENT_TYPE_EXTENSIONS[String(contentType).split(';')[0].trim().toLowerCase()] ?? ''
}

/** @returns a bounded file name without directory separators. */
function normalizeFileName(value, id) {
  const raw = optionalText(value, 'File name', MAX_FILE_NAME)
  const base = raw.split(/[/\\]/).pop() ?? ''
  const trimmed = base.trim()
  return trimmed === '' ? `upload-${id.slice(0, 8)}` : trimmed
}

/**
 * Validate and normalize a template field list.
 * @param value - client-supplied field array.
 * @param existing - current fields, whose keys are preserved when resent.
 * @returns normalized fields with stable or freshly generated keys.
 */
function normalizeFields(value, existing) {
  if (!Array.isArray(value)) throw new AlertError('invalid-input', 'Fields must be an array', 400)
  if (value.length === 0) throw new AlertError('invalid-input', 'A template needs at least one field', 400)
  if (value.length > MAX_FIELDS) {
    throw new AlertError('invalid-input', `A template supports at most ${String(MAX_FIELDS)} fields`, 400)
  }
  const previous = new Map((Array.isArray(existing) ? existing : []).map(field => [field.key, field]))
  const seen = new Set()
  const fields = []
  for (const item of value) {
    if (!isRecord(item)) throw new AlertError('invalid-input', 'Each field must be an object', 400)
    const label = requiredText(item.label, 'Field label', MAX_FIELD_LABEL)
    const type = typeof item.type === 'string' ? item.type.trim() : ''
    if (!FIELD_TYPES.includes(type)) {
      throw new AlertError('invalid-input', `Field type must be one of ${FIELD_TYPES.join(', ')}`, 400)
    }
    const unit = optionalText(item.unit, 'Field unit', MAX_FIELD_UNIT)
    if (item.required !== undefined && typeof item.required !== 'boolean') {
      throw new AlertError('invalid-input', 'Field required must be a boolean', 400)
    }
    const providedKey = typeof item.key === 'string' ? item.key.trim() : ''
    const key = providedKey !== '' && previous.has(providedKey) ? providedKey : newFieldKey()
    if (seen.has(key)) throw new AlertError('invalid-input', 'Field keys must be unique', 400)
    seen.add(key)
    fields.push({ key, label, type, unit, required: item.required === true })
  }
  return fields
}

/** @returns record values validated against one template's fields. */
function normalizeValues(value, fields) {
  if (value === undefined || value === null) return {}
  if (!isRecord(value)) throw new AlertError('invalid-input', 'Values must be an object keyed by field key', 400)
  const byKey = new Map((Array.isArray(fields) ? fields : []).map(field => [field.key, field]))
  const values = {}
  for (const [key, raw] of Object.entries(value)) {
    const field = byKey.get(key)
    if (field === undefined) continue
    if (field.type === 'number') {
      if (typeof raw !== 'number' || !Number.isFinite(raw)) {
        throw new AlertError('invalid-input', `Field "${field.label}" must be a number`, 400)
      }
      values[key] = raw
      continue
    }
    if (field.type === 'text') {
      if (typeof raw !== 'string') {
        throw new AlertError('invalid-input', `Field "${field.label}" must be text`, 400)
      }
      values[key] = raw
      continue
    }
    if (!Array.isArray(raw)) {
      throw new AlertError('invalid-input', `Field "${field.label}" must be a list of uploaded files`, 400)
    }
    values[key] = raw.map(item => normalizeId(item, 'File id'))
  }
  return values
}

/** Reject a record that omits a value its template marks required. */
function assertRequiredFields(fields, values) {
  for (const field of fields) {
    if (field.required !== true) continue
    const value = values[field.key]
    if (field.type === 'number') {
      if (value === undefined) throw new AlertError('invalid-input', `Field "${field.label}" is required`, 400)
      continue
    }
    if (field.type === 'text') {
      if (typeof value !== 'string' || value.trim() === '') {
        throw new AlertError('invalid-input', `Field "${field.label}" is required`, 400)
      }
      continue
    }
    if (!Array.isArray(value) || value.length === 0) {
      throw new AlertError('invalid-input', `Field "${field.label}" needs at least one file`, 400)
    }
  }
}

/** @returns every file id referenced by a record's values. */
function referencedFileIds(values) {
  const ids = new Set()
  if (!isRecord(values)) return ids
  for (const value of Object.values(values)) {
    if (!Array.isArray(value)) continue
    for (const item of value) {
      if (typeof item === 'string' && item !== '') ids.add(item)
    }
  }
  return ids
}

/** @returns media files referenced by values, mapped to the owning field. */
function collectMediaValues(values, fields) {
  const media = new Map()
  for (const field of fields) {
    if (!MEDIA_KINDS.has(field.type)) continue
    const ids = values[field.key]
    if (!Array.isArray(ids)) continue
    for (const fileId of ids) {
      const existing = media.get(fileId)
      if (existing !== undefined && existing.key !== field.key) {
        throw new AlertError('invalid-input', 'The same file cannot be attached to two fields', 400)
      }
      media.set(fileId, field)
    }
  }
  return media
}

/** Reject media ids that are unknown, of the wrong kind, or attached elsewhere. */
function assertMediaFiles(media, files, recordId) {
  const byId = new Map(files.map(file => [file.id, file]))
  for (const [fileId, field] of media) {
    const file = byId.get(fileId)
    if (file === undefined) {
      throw new AlertError('invalid-input', `Uploaded file ${fileId} was not found; upload it again`, 400)
    }
    if (file.kind !== field.type) {
      throw new AlertError('invalid-input', `File "${file.name}" is not a ${field.type} file`, 400)
    }
    if (file.recordId !== '' && file.recordId !== recordId) {
      throw new AlertError('file-in-use', `File "${file.name}" is already attached to another record`, 409)
    }
  }
}

/** @returns the file rows whose record link needs updating. */
function linkedFileUpdates(files, media, recordId) {
  const byId = new Map(files.map(file => [file.id, file]))
  const updates = []
  for (const [fileId, field] of media) {
    const file = byId.get(fileId)
    if (file === undefined) continue
    if (file.recordId === recordId && file.fieldKey === field.key) continue
    updates.push({ ...file, recordId, fieldKey: field.key })
  }
  return updates
}

/** @returns descendant directory ids, including the directory itself. */
function subtreeIds(nodes, id) {
  const ids = new Set([id])
  let grew = true
  while (grew) {
    grew = false
    for (const node of nodes) {
      if (node.parentId !== null && ids.has(node.parentId) && !ids.has(node.id)) {
        ids.add(node.id)
        grew = true
      }
    }
  }
  return ids
}

/** @returns counts of items grouped by one key. */
function countBy(items, key) {
  const counts = new Map()
  for (const item of items) {
    const value = item[key]
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return counts
}

/** @returns the byte range requested by a Range header, or undefined for the whole file. */
function rangeOf(request, size) {
  const header = request.headers.get('range')
  if (header === null) return undefined
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim())
  if (match === null) return undefined
  let start = match[1] === '' ? undefined : Number(match[1])
  let end = match[2] === '' ? undefined : Number(match[2])
  if (start === undefined) {
    const length = end ?? 0
    if (length <= 0) return undefined
    start = Math.max(size - length, 0)
    end = size - 1
  } else if (end === undefined || end >= size) {
    end = size - 1
  }
  if (start >= size || start > end) return { invalid: true }
  return { start, end, length: end - start + 1 }
}

/** @returns a Content-Disposition value that keeps a Unicode file name. */
function contentDisposition(name) {
  const fallback = String(name).replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_')
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(String(name))}`
}

/** @returns response headers for a media byte stream. */
function mediaHeaders(file, size, range, download) {
  const headers = {
    'content-type': file.contentType,
    'accept-ranges': 'bytes',
    'cache-control': 'private, max-age=300',
    'content-length': String(range === undefined ? size : range.length),
  }
  if (range !== undefined) {
    headers['content-range'] = `bytes ${String(range.start)}-${String(range.end)}/${String(size)}`
  }
  if (download) headers['content-disposition'] = contentDisposition(file.name)
  return headers
}

/** @returns a JSON response the browser page can consume. */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

/** @returns the parsed URL of one request. */
function requestUrl(request) {
  return new URL(request.url, 'http://localhost')
}

/** Read and validate one JSON request body. */
async function readJsonBody(request) {
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new AlertError('invalid-input', 'Expected a JSON request', 400)
  }
  let body
  try {
    body = await request.json()
  } catch (_invalidJson) {
    throw new AlertError('invalid-input', 'The request body is not valid JSON', 400)
  }
  if (!isRecord(body)) throw new AlertError('invalid-input', 'The request body must be an object', 400)
  return body
}

/** @returns a storage failure mapped to a 503 response error. */
function storageError(label, error) {
  if (error instanceof AlertError) return error
  if (isRecord(error) && error.code === 'DATABASE_UNAVAILABLE') return error
  return new AlertError('storage-unavailable', `${label} failed: ${messageOf(error)}`, 503)
}

/**
 * Persist one uploaded file's bytes into MinIO or the local media directory.
 * @param ctx - Host context used to resolve the optional database service.
 * @param config - Plugin configuration that owns the local media directory.
 * @param file - File metadata whose id names the stored object.
 * @param bytes - Raw file bytes.
 * @returns the storage discriminator, object key, and local path.
 */
async function storeMediaBytes(ctx, config, file, bytes) {
  try {
    const database = databaseOf(ctx)
    if (database !== undefined) {
      const bucket = database.minio().bucket
      const objectKey = `${MEDIA_KEY_PREFIX}/${file.id}`
      await database.withMinio(client => client.putObject(
        bucket,
        objectKey,
        bytes,
        bytes.length,
        { 'Content-Type': file.contentType },
      ))
      return { storage: 'minio', objectKey, localPath: '' }
    }
    const target = join(baseDirOf(config), MEDIA_DIR, `${file.id}${extensionOf(file.name, file.contentType)}`)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, bytes)
    return { storage: 'local', objectKey: '', localPath: target }
  } catch (error) {
    throw storageError('Storing the uploaded file', error)
  }
}

/**
 * Delete one file's stored bytes from MinIO or the local media directory.
 * @param ctx - Host context used to resolve the optional database service.
 * @param file - Stored file metadata.
 */
async function removeMediaObject(ctx, file) {
  if (file.storage === 'minio') {
    const database = databaseOf(ctx)
    if (database === undefined) {
      throw new AlertError('storage-unavailable', 'MinIO is not available because the database plugin is not installed', 503)
    }
    if (file.objectKey === '') return
    const bucket = database.minio().bucket
    await database.withMinio(client => client.removeObject(bucket, file.objectKey))
    return
  }
  if (file.localPath === '') return
  try {
    await unlink(file.localPath)
  } catch (error) {
    if (!isMissingFile(error)) throw error
  }
}

/** @returns an empty local JSON state. */
function emptyState() {
  return { version: 1, nodes: [], templates: [], records: [], files: [] }
}

/**
 * Create the local JSON provider: one atomically written file and a serialized
 * write queue.
 * @param config - Plugin configuration that resolves the base directory.
 * @returns the local provider.
 */
function createLocalProvider(config) {
  let queue = Promise.resolve()
  const file = localDataFile(config)

  async function load() {
    let text
    try {
      text = await readFile(file, 'utf8')
    } catch (error) {
      if (isMissingFile(error)) return emptyState()
      throw new AlertError(
        'storage-corrupt',
        `The local alert record file at ${file} could not be read: ${messageOf(error)}`,
        500,
      )
    }
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch (_invalidJson) {
      throw new AlertError('storage-corrupt', `The local alert record file at ${file} is not valid JSON`, 500)
    }
    if (!isRecord(parsed)) {
      throw new AlertError('storage-corrupt', `The local alert record file at ${file} has an unexpected structure`, 500)
    }
    return {
      version: 1,
      nodes: (Array.isArray(parsed.nodes) ? parsed.nodes : []).filter(isRecord).map(normalizeNode),
      templates: (Array.isArray(parsed.templates) ? parsed.templates : []).filter(isRecord).map(normalizeTemplate),
      records: (Array.isArray(parsed.records) ? parsed.records : []).filter(isRecord).map(normalizeRecord),
      files: (Array.isArray(parsed.files) ? parsed.files : []).filter(isRecord).map(normalizeFile),
    }
  }

  async function persist(state) {
    await mkdir(dirname(file), { recursive: true })
    const temporary = `${file}.tmp`
    await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
    await rename(temporary, file)
  }

  async function read() {
    await queue.catch(() => {})
    return load()
  }

  async function mutate(change) {
    const run = queue.then(async () => {
      const state = await load()
      const result = change(state)
      await persist(state)
      return result
    })
    queue = run.then(() => {}, () => {})
    return run
  }

  function upsert(items, additions) {
    for (const item of additions) {
      const index = items.findIndex(candidate => candidate.id === item.id)
      if (index === -1) items.push({ ...item })
      else items[index] = { ...item }
    }
    return additions
  }

  function drop(items, ids) {
    const doomed = new Set(ids)
    return items.filter(item => !doomed.has(item.id))
  }

  return {
    mode: 'local',
    async nodes() { return (await read()).nodes },
    async templates() { return (await read()).templates },
    async records() { return (await read()).records },
    async files() { return (await read()).files },
    async putNodes(nodes) { return mutate(state => upsert(state.nodes, nodes)) },
    async putTemplates(templates) { return mutate(state => upsert(state.templates, templates)) },
    async putRecords(records) { return mutate(state => upsert(state.records, records)) },
    async putFiles(files) { return mutate(state => upsert(state.files, files)) },
    async dropNodes(ids) { await mutate(state => { state.nodes = drop(state.nodes, ids) }) },
    async dropTemplates(ids) { await mutate(state => { state.templates = drop(state.templates, ids) }) },
    async dropRecords(ids) { await mutate(state => { state.records = drop(state.records, ids) }) },
    async dropFiles(ids) { await mutate(state => { state.files = drop(state.files, ids) }) },
  }
}

/** @returns one PostgreSQL directory row as a plugin node. */
function pgNode(row) {
  return normalizeNode({
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

/** @returns one PostgreSQL template row as a plugin template. */
function pgTemplate(row) {
  return normalizeTemplate({
    id: row.id,
    nodeId: row.node_id,
    name: row.name,
    description: row.description,
    fields: jsonColumn(row.fields, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

/** @returns one PostgreSQL record row as a plugin record. */
function pgRecord(row) {
  return normalizeRecord({
    id: row.id,
    nodeId: row.node_id,
    templateId: row.template_id,
    title: row.title,
    severity: row.severity,
    occurredAt: row.occurred_at,
    note: row.note,
    values: jsonColumn(row.values, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

/** @returns one PostgreSQL file row as a plugin file. */
function pgFile(row) {
  return normalizeFile({
    id: row.id,
    recordId: row.record_id,
    fieldKey: row.field_key,
    kind: row.kind,
    name: row.name,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    storage: row.storage,
    objectKey: row.object_key,
    localPath: row.local_path,
    createdAt: row.created_at,
  })
}

/**
 * Create the PostgreSQL provider. Tables are created lazily on first use and
 * the creation promise is retried after a failure.
 * @param database - Database connections service.
 * @returns the PostgreSQL provider.
 */
function createPostgresProvider(database) {
  let ready

  async function createTables() {
    await database.query(`
      CREATE TABLE IF NOT EXISTS ${NODE_TABLE} (
        id text PRIMARY KEY,
        parent_id text,
        name text NOT NULL,
        description text NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)
    await database.query(`
      CREATE TABLE IF NOT EXISTS ${TEMPLATE_TABLE} (
        id text PRIMARY KEY,
        node_id text NOT NULL,
        name text NOT NULL,
        description text NOT NULL DEFAULT '',
        fields jsonb NOT NULL DEFAULT '[]'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)
    await database.query(`
      CREATE TABLE IF NOT EXISTS ${RECORD_TABLE} (
        id text PRIMARY KEY,
        node_id text NOT NULL,
        template_id text NOT NULL,
        title text NOT NULL,
        severity text NOT NULL DEFAULT '',
        occurred_at timestamptz NOT NULL DEFAULT now(),
        note text NOT NULL DEFAULT '',
        values jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)
    await database.query(`
      CREATE TABLE IF NOT EXISTS ${FILE_TABLE} (
        id text PRIMARY KEY,
        record_id text NOT NULL DEFAULT '',
        field_key text NOT NULL DEFAULT '',
        kind text NOT NULL,
        name text NOT NULL,
        content_type text NOT NULL,
        size_bytes bigint NOT NULL DEFAULT 0,
        storage text NOT NULL DEFAULT 'local',
        object_key text NOT NULL DEFAULT '',
        local_path text NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `)
  }

  function ensureSchema() {
    if (ready === undefined) {
      ready = createTables().catch((error) => {
        ready = undefined
        throw error
      })
    }
    return ready
  }

  return {
    mode: 'postgres',
    async nodes() {
      await ensureSchema()
      const result = await database.query(
        `SELECT id, parent_id, name, description, created_at, updated_at FROM ${NODE_TABLE}`,
      )
      return result.rows.map(pgNode)
    },
    async templates() {
      await ensureSchema()
      const result = await database.query(
        `SELECT id, node_id, name, description, fields, created_at, updated_at FROM ${TEMPLATE_TABLE}`,
      )
      return result.rows.map(pgTemplate)
    },
    async records() {
      await ensureSchema()
      const result = await database.query(`
        SELECT id, node_id, template_id, title, severity, occurred_at, note, values, created_at, updated_at
        FROM ${RECORD_TABLE}
      `)
      return result.rows.map(pgRecord)
    },
    async files() {
      await ensureSchema()
      const result = await database.query(`
        SELECT id, record_id, field_key, kind, name, content_type, size_bytes, storage, object_key, local_path, created_at
        FROM ${FILE_TABLE}
      `)
      return result.rows.map(pgFile)
    },
    async putNodes(nodes) {
      await ensureSchema()
      for (const node of nodes) {
        await database.query(`
          INSERT INTO ${NODE_TABLE} (id, parent_id, name, description, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET
            parent_id = EXCLUDED.parent_id,
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            updated_at = EXCLUDED.updated_at
        `, [node.id, node.parentId, node.name, node.description, node.createdAt, node.updatedAt])
      }
    },
    async putTemplates(templates) {
      await ensureSchema()
      for (const template of templates) {
        await database.query(`
          INSERT INTO ${TEMPLATE_TABLE} (id, node_id, name, description, fields, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            node_id = EXCLUDED.node_id,
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            fields = EXCLUDED.fields,
            updated_at = EXCLUDED.updated_at
        `, [
          template.id,
          template.nodeId,
          template.name,
          template.description,
          JSON.stringify(template.fields ?? []),
          template.createdAt,
          template.updatedAt,
        ])
      }
    },
    async putRecords(records) {
      await ensureSchema()
      for (const record of records) {
        await database.query(`
          INSERT INTO ${RECORD_TABLE}
            (id, node_id, template_id, title, severity, occurred_at, note, values, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)
          ON CONFLICT (id) DO UPDATE SET
            node_id = EXCLUDED.node_id,
            template_id = EXCLUDED.template_id,
            title = EXCLUDED.title,
            severity = EXCLUDED.severity,
            occurred_at = EXCLUDED.occurred_at,
            note = EXCLUDED.note,
            values = EXCLUDED.values,
            updated_at = EXCLUDED.updated_at
        `, [
          record.id,
          record.nodeId,
          record.templateId,
          record.title,
          record.severity,
          record.occurredAt,
          record.note,
          JSON.stringify(record.values ?? {}),
          record.createdAt,
          record.updatedAt,
        ])
      }
    },
    async putFiles(files) {
      await ensureSchema()
      for (const file of files) {
        await database.query(`
          INSERT INTO ${FILE_TABLE}
            (id, record_id, field_key, kind, name, content_type, size_bytes, storage, object_key, local_path, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET
            record_id = EXCLUDED.record_id,
            field_key = EXCLUDED.field_key,
            kind = EXCLUDED.kind,
            name = EXCLUDED.name,
            content_type = EXCLUDED.content_type,
            size_bytes = EXCLUDED.size_bytes,
            storage = EXCLUDED.storage,
            object_key = EXCLUDED.object_key,
            local_path = EXCLUDED.local_path
        `, [
          file.id,
          file.recordId,
          file.fieldKey,
          file.kind,
          file.name,
          file.contentType,
          file.sizeBytes,
          file.storage,
          file.objectKey,
          file.localPath,
          file.createdAt,
        ])
      }
    },
    async dropNodes(ids) {
      if (ids.length === 0) return
      await ensureSchema()
      await database.query(`DELETE FROM ${NODE_TABLE} WHERE id = ANY($1::text[])`, [ids])
    },
    async dropTemplates(ids) {
      if (ids.length === 0) return
      await ensureSchema()
      await database.query(`DELETE FROM ${TEMPLATE_TABLE} WHERE id = ANY($1::text[])`, [ids])
    },
    async dropRecords(ids) {
      if (ids.length === 0) return
      await ensureSchema()
      await database.query(`DELETE FROM ${RECORD_TABLE} WHERE id = ANY($1::text[])`, [ids])
    },
    async dropFiles(ids) {
      if (ids.length === 0) return
      await ensureSchema()
      await database.query(`DELETE FROM ${FILE_TABLE} WHERE id = ANY($1::text[])`, [ids])
    },
  }
}

/**
 * Resolve the storage provider from the database plugin presence. The provider
 * is re-resolved when the database service appears or disappears, and never
 * falls back to local files while PostgreSQL is failing.
 * @param ctx - Host context used to resolve the database service.
 * @param config - Plugin configuration.
 * @returns storage mode and provider accessors.
 */
function createStorage(ctx, config) {
  let resolvedDatabase
  let provider
  return {
    mode() {
      return databaseOf(ctx) === undefined ? 'local' : 'postgres'
    },
    provider() {
      const database = databaseOf(ctx)
      if (provider === undefined || database !== resolvedDatabase) {
        resolvedDatabase = database
        provider = database === undefined ? createLocalProvider(config) : createPostgresProvider(database)
      }
      return provider
    },
  }
}

/** @returns one directory as the page consumes it. */
function projectNode(node) {
  return {
    id: node.id,
    parentId: node.parentId,
    name: node.name,
    description: node.description,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
  }
}

/** @returns one directory with its template and record counts. */
function projectDirectory(node, templates, records) {
  return {
    ...projectNode(node),
    templateCount: templates.filter(template => template.nodeId === node.id).length,
    recordCount: records.filter(record => record.nodeId === node.id).length,
  }
}

/** @returns one template as the page consumes it. */
function projectTemplate(template, recordCount) {
  return {
    id: template.id,
    nodeId: template.nodeId,
    name: template.name,
    description: template.description,
    fields: template.fields.map(field => ({
      key: field.key,
      label: field.label,
      type: field.type,
      unit: field.unit,
      required: field.required,
    })),
    recordCount,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  }
}

/** @returns one file as the page consumes it. */
function projectFile(file) {
  const id = encodeURIComponent(file.id)
  return {
    id: file.id,
    recordId: file.recordId,
    fieldKey: file.fieldKey,
    kind: file.kind,
    name: file.name,
    contentType: file.contentType,
    sizeBytes: file.sizeBytes,
    storage: file.storage,
    createdAt: file.createdAt,
    contentUrl: `api/record/file/content?id=${id}`,
    downloadUrl: `api/record/file/download?id=${id}`,
  }
}

/**
 * @param record - Stored record.
 * @param template - Template the record uses, when it still exists.
 * @param files - Every stored file.
 * @returns the record projection with template name, filtered values, and files.
 */
function projectRecord(record, template, files) {
  const fields = template === undefined ? [] : template.fields
  const known = new Set(fields.map(field => field.key))
  const values = {}
  for (const [key, value] of Object.entries(record.values)) {
    if (known.has(key)) values[key] = value
  }
  const referenced = referencedFileIds(values)
  const linked = new Set(files.filter(file => file.recordId === record.id).map(file => file.id))
  return {
    id: record.id,
    nodeId: record.nodeId,
    templateId: record.templateId,
    templateName: template === undefined ? '' : template.name,
    title: record.title,
    severity: record.severity,
    occurredAt: record.occurredAt,
    note: record.note,
    values,
    files: files
      .filter(file => linked.has(file.id) || referenced.has(file.id))
      .map(projectFile),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

/**
 * Alert record library operations, shared by the Fetch routes, the model tools,
 * and any other Host plugin that resolves the `alertRecords` service.
 */
export class AlertRecordsService extends Service {
  /**
   * @param ctx - Host context owning the service.
   * @param config - Resolved plugin configuration.
   */
  constructor(ctx, config) {
    super(ctx, 'alertRecords')
    this.config = { localDir: '', maxUploadMb: DEFAULT_UPLOAD_MB, ...(isRecord(config) ? config : {}) }
    this.storage = createStorage(ctx, this.config)
  }

  /** @returns the upload size limit in bytes. */
  uploadLimit() {
    const megabytes = Number(this.config.maxUploadMb)
    const bounded = Number.isFinite(megabytes) && megabytes > 0 ? megabytes : DEFAULT_UPLOAD_MB
    return Math.floor(bounded * 1024 * 1024)
  }

  /** @returns the storage mode, media backend, and upload limit. */
  async settings() {
    const mode = this.storage.mode()
    return {
      mode,
      media: mode === 'postgres' ? 'minio' : 'local',
      maxUploadMb: Math.floor(this.uploadLimit() / (1024 * 1024)),
    }
  }

  /**
   * @returns every directory with template and record counts, sorted by name.
   */
  async tree() {
    const provider = this.storage.provider()
    const [nodes, templates, records] = await Promise.all([
      provider.nodes(),
      provider.templates(),
      provider.records(),
    ])
    const templateCounts = countBy(templates, 'nodeId')
    const recordCounts = countBy(records, 'nodeId')
    const mode = this.storage.mode()
    return {
      mode,
      media: mode === 'postgres' ? 'minio' : 'local',
      nodes: nodes
        .map(node => ({
          ...projectNode(node),
          templateCount: templateCounts.get(node.id) ?? 0,
          recordCount: recordCounts.get(node.id) ?? 0,
        }))
        .sort((left, right) => left.name.localeCompare(right.name, 'zh')),
    }
  }

  /**
   * @param input - `{ parentId?, name, description? }`.
   * @returns the created directory.
   */
  async createDirectory(input) {
    const body = isRecord(input) ? input : {}
    const name = requiredText(body.name, 'Directory name', MAX_DIRECTORY_NAME)
    const description = optionalText(body.description, 'Description', MAX_DESCRIPTION)
    const parentId = normalizeParentId(body.parentId)
    const provider = this.storage.provider()
    const nodes = await provider.nodes()
    if (parentId !== null && !nodes.some(node => node.id === parentId)) {
      throw new AlertError('not-found', 'The parent directory was not found', 404)
    }
    assertDirectoryNameFree(nodes, parentId, name, '')
    const now = new Date().toISOString()
    const node = { id: randomUUID(), parentId, name, description, createdAt: now, updatedAt: now }
    await provider.putNodes([node])
    return { ...projectNode(node), templateCount: 0, recordCount: 0 }
  }

  /**
   * @param input - `{ id, name?, description? }`; omitted fields keep their value.
   * @returns the updated directory.
   */
  async updateDirectory(input) {
    const body = isRecord(input) ? input : {}
    const id = normalizeId(body.id, 'Directory id')
    const provider = this.storage.provider()
    const [nodes, templates, records] = await Promise.all([
      provider.nodes(),
      provider.templates(),
      provider.records(),
    ])
    const current = nodes.find(node => node.id === id)
    if (current === undefined) throw new AlertError('not-found', 'The directory was not found', 404)
    const name = body.name === undefined ? current.name : requiredText(body.name, 'Directory name', MAX_DIRECTORY_NAME)
    const description = body.description === undefined
      ? current.description
      : optionalText(body.description, 'Description', MAX_DESCRIPTION)
    if (name !== current.name) assertDirectoryNameFree(nodes, current.parentId, name, id)
    const next = { ...current, name, description, updatedAt: new Date().toISOString() }
    await provider.putNodes([next])
    return projectDirectory(next, templates, records)
  }

  /**
   * Delete one directory subtree, its templates, its records, and their files.
   * @param id - directory id.
   * @returns the removed directory id.
   */
  async deleteDirectory(id) {
    const directoryId = normalizeId(id, 'Directory id')
    const provider = this.storage.provider()
    const [nodes, templates, records, files] = await Promise.all([
      provider.nodes(),
      provider.templates(),
      provider.records(),
      provider.files(),
    ])
    if (!nodes.some(node => node.id === directoryId)) {
      throw new AlertError('not-found', 'The directory was not found', 404)
    }
    const nodeIds = subtreeIds(nodes, directoryId)
    const templateIds = new Set(
      templates.filter(template => nodeIds.has(template.nodeId)).map(template => template.id),
    )
    const doomedRecords = records.filter(record => nodeIds.has(record.nodeId) || templateIds.has(record.templateId))
    const recordIds = new Set(doomedRecords.map(record => record.id))
    const fileIds = new Set(files.filter(file => recordIds.has(file.recordId)).map(file => file.id))
    for (const record of doomedRecords) {
      for (const fileId of referencedFileIds(record.values)) fileIds.add(fileId)
    }
    await this.removeFileRows([...fileIds])
    await provider.dropRecords([...recordIds])
    await provider.dropTemplates([...templateIds])
    await provider.dropNodes([...nodeIds])
    return directoryId
  }

  /**
   * @param nodeId - directory id; an empty value lists every template.
   * @returns templates with their record counts, sorted by name.
   */
  async listTemplates(nodeId) {
    const provider = this.storage.provider()
    const [nodes, templates, records] = await Promise.all([
      provider.nodes(),
      provider.templates(),
      provider.records(),
    ])
    const wanted = typeof nodeId === 'string' ? nodeId.trim() : ''
    let selected = templates
    if (wanted !== '') {
      const id = normalizeId(wanted, 'Directory id')
      if (!nodes.some(node => node.id === id)) {
        throw new AlertError('not-found', 'The directory was not found', 404)
      }
      selected = templates.filter(template => template.nodeId === id)
    }
    const counts = countBy(records, 'templateId')
    return selected
      .map(template => projectTemplate(template, counts.get(template.id) ?? 0))
      .sort((left, right) => left.name.localeCompare(right.name, 'zh'))
  }

  /**
   * @param input - `{ nodeId, name, description?, fields }`.
   * @returns the created template.
   */
  async createTemplate(input) {
    const body = isRecord(input) ? input : {}
    const nodeId = normalizeId(body.nodeId, 'Directory id')
    const name = requiredText(body.name, 'Template name', MAX_TEMPLATE_NAME)
    const description = optionalText(body.description, 'Description', MAX_DESCRIPTION)
    const fields = normalizeFields(body.fields, [])
    const provider = this.storage.provider()
    const nodes = await provider.nodes()
    if (!nodes.some(node => node.id === nodeId)) {
      throw new AlertError('not-found', 'The directory was not found', 404)
    }
    const now = new Date().toISOString()
    const template = { id: randomUUID(), nodeId, name, description, fields, createdAt: now, updatedAt: now }
    await provider.putTemplates([template])
    return projectTemplate(template, 0)
  }

  /**
   * @param input - `{ id, name?, description?, fields? }`; omitted fields keep
   *   their value, and a supplied field list replaces the current one.
   * @returns the updated template.
   */
  async updateTemplate(input) {
    const body = isRecord(input) ? input : {}
    const id = normalizeId(body.id, 'Template id')
    const provider = this.storage.provider()
    const [templates, records] = await Promise.all([provider.templates(), provider.records()])
    const current = templates.find(template => template.id === id)
    if (current === undefined) throw new AlertError('not-found', 'The template was not found', 404)
    const name = body.name === undefined ? current.name : requiredText(body.name, 'Template name', MAX_TEMPLATE_NAME)
    const description = body.description === undefined
      ? current.description
      : optionalText(body.description, 'Description', MAX_DESCRIPTION)
    let fields = current.fields
    if (body.fields !== undefined) {
      fields = normalizeFields(body.fields, current.fields)
      const inUse = records.some(record => record.templateId === id)
      if (inUse) {
        const previous = new Map(current.fields.map(field => [field.key, field]))
        for (const field of fields) {
          const before = previous.get(field.key)
          if (before !== undefined && before.type !== field.type) {
            throw new AlertError(
              'field-type-in-use',
              `Field "${field.label}" cannot change type while records use this template`,
              409,
            )
          }
        }
      }
    }
    const next = { ...current, name, description, fields, updatedAt: new Date().toISOString() }
    await provider.putTemplates([next])
    return projectTemplate(next, records.filter(record => record.templateId === id).length)
  }

  /**
   * Delete one template. A template that still has records is refused so the
   * stored records never lose the field definitions they were created with.
   * @param id - template id.
   * @returns the removed template id.
   */
  async deleteTemplate(id) {
    const templateId = normalizeId(id, 'Template id')
    const provider = this.storage.provider()
    const [templates, records] = await Promise.all([
      provider.templates(),
      provider.records(),
    ])
    if (!templates.some(template => template.id === templateId)) {
      throw new AlertError('not-found', 'The template was not found', 404)
    }
    if (records.some(record => record.templateId === templateId)) {
      throw new AlertError('template-in-use', 'This template still has alert records; delete those records before deleting the template', 409)
    }
    await provider.dropTemplates([templateId])
    return templateId
  }

  /**
   * @param id - directory id.
   * @returns one directory with its template and record counts.
   */
  async getDirectory(id) {
    const directoryId = normalizeId(id, 'Directory id')
    const provider = this.storage.provider()
    const [nodes, templates, records] = await Promise.all([
      provider.nodes(),
      provider.templates(),
      provider.records(),
    ])
    const node = nodes.find(candidate => candidate.id === directoryId)
    if (node === undefined) throw new AlertError('not-found', 'The directory was not found', 404)
    return projectDirectory(node, templates, records)
  }

  /**
   * @param id - template id.
   * @returns one template with its record count.
   */
  async getTemplate(id) {
    const templateId = normalizeId(id, 'Template id')
    const provider = this.storage.provider()
    const [templates, records] = await Promise.all([
      provider.templates(),
      provider.records(),
    ])
    const template = templates.find(candidate => candidate.id === templateId)
    if (template === undefined) throw new AlertError('not-found', 'The template was not found', 404)
    return projectTemplate(template, records.filter(record => record.templateId === templateId).length)
  }

  /**
   * @param id - record id.
   * @returns one record with its template name, field values, and stored files.
   */
  async getRecord(id) {
    const recordId = normalizeId(id, 'Record id')
    const provider = this.storage.provider()
    const [templates, records, files] = await Promise.all([
      provider.templates(),
      provider.records(),
      provider.files(),
    ])
    const record = records.find(candidate => candidate.id === recordId)
    if (record === undefined) throw new AlertError('not-found', 'The alert record was not found', 404)
    const template = templates.find(candidate => candidate.id === record.templateId)
    return projectRecord(record, template, files)
  }

  /**
   * @param filter - `{ nodeId?, templateId?, query?, limit?, offset? }`.
   * @returns matching records newest first and the full match count.
   */
  async listRecords(filter) {
    const body = isRecord(filter) ? filter : {}
    const provider = this.storage.provider()
    const [templates, records, files] = await Promise.all([
      provider.templates(),
      provider.records(),
      provider.files(),
    ])
    const nodeId = typeof body.nodeId === 'string' ? body.nodeId.trim() : ''
    const templateId = typeof body.templateId === 'string' ? body.templateId.trim() : ''
    const query = typeof body.query === 'string' ? body.query.trim().toLocaleLowerCase() : ''
    const limit = normalizeLimit(body.limit, DEFAULT_LIMIT, MAX_LIMIT)
    const offset = normalizeOffset(body.offset)
    const selected = records
      .filter((record) => {
        if (nodeId !== '' && record.nodeId !== nodeId) return false
        if (templateId !== '' && record.templateId !== templateId) return false
        if (query !== '') {
          const haystack = `${record.title}\n${record.note}\n${JSON.stringify(record.values)}`.toLocaleLowerCase()
          if (!haystack.includes(query)) return false
        }
        return true
      })
      .sort((left, right) => {
        const byTime = String(right.occurredAt).localeCompare(String(left.occurredAt))
        return byTime !== 0 ? byTime : String(right.createdAt).localeCompare(String(left.createdAt))
      })
    const byId = new Map(templates.map(template => [template.id, template]))
    return {
      records: selected
        .slice(offset, offset + limit)
        .map(record => projectRecord(record, byId.get(record.templateId), files)),
      total: selected.length,
    }
  }

  /**
   * @param input - `{ nodeId, templateId, title, severity?, occurredAt?, note?, values? }`.
   * @returns the created record.
   */
  async createRecord(input) {
    const body = isRecord(input) ? input : {}
    const provider = this.storage.provider()
    const [nodes, templates, files] = await Promise.all([
      provider.nodes(),
      provider.templates(),
      provider.files(),
    ])
    const nodeId = normalizeId(body.nodeId, 'Directory id')
    if (!nodes.some(node => node.id === nodeId)) {
      throw new AlertError('not-found', 'The selected directory was not found', 404)
    }
    const templateId = normalizeId(body.templateId, 'Template id')
    const template = templates.find(candidate => candidate.id === templateId)
    if (template === undefined) throw new AlertError('not-found', 'The selected template was not found', 404)
    if (template.nodeId !== nodeId) {
      throw new AlertError('invalid-input', 'The template does not belong to the selected directory', 400)
    }
    const title = requiredText(body.title, 'Title', MAX_TITLE)
    const severity = normalizeSeverity(body.severity)
    const occurredAt = normalizeOccurredAt(body.occurredAt)
    const note = optionalText(body.note, 'Note', MAX_NOTE)
    const values = normalizeValues(body.values, template.fields)
    assertRequiredFields(template.fields, values)
    const media = collectMediaValues(values, template.fields)
    assertMediaFiles(media, files, '')
    const now = new Date().toISOString()
    const record = {
      id: randomUUID(),
      nodeId,
      templateId,
      title,
      severity,
      occurredAt,
      note,
      values,
      createdAt: now,
      updatedAt: now,
    }
    await provider.putRecords([record])
    const links = linkedFileUpdates(files, media, record.id)
    if (links.length > 0) await provider.putFiles(links)
    const after = await provider.files()
    return projectRecord(record, template, after)
  }

  /**
   * @param id - record id.
   * @param input - `{ nodeId?, templateId?, title?, severity?, occurredAt?, note?, values? }`;
   *   omitted fields keep their value, and a supplied value map replaces the
   *   current one.
   * @returns the updated record.
   */
  async updateRecord(id, input) {
    const body = isRecord(input) ? input : {}
    const recordId = normalizeId(id, 'Record id')
    const provider = this.storage.provider()
    const [nodes, templates, records, files] = await Promise.all([
      provider.nodes(),
      provider.templates(),
      provider.records(),
      provider.files(),
    ])
    const current = records.find(record => record.id === recordId)
    if (current === undefined) throw new AlertError('not-found', 'The alert record was not found', 404)
    const nodeId = body.nodeId === undefined ? current.nodeId : normalizeId(body.nodeId, 'Directory id')
    if (!nodes.some(node => node.id === nodeId)) {
      throw new AlertError('not-found', 'The selected directory was not found', 404)
    }
    const templateId = body.templateId === undefined ? current.templateId : normalizeId(body.templateId, 'Template id')
    const template = templates.find(candidate => candidate.id === templateId)
    if (template === undefined) throw new AlertError('not-found', 'The selected template was not found', 404)
    if (template.nodeId !== nodeId) {
      throw new AlertError('invalid-input', 'The template does not belong to the selected directory', 400)
    }
    const title = body.title === undefined ? current.title : requiredText(body.title, 'Title', MAX_TITLE)
    const severity = body.severity === undefined ? current.severity : normalizeSeverity(body.severity)
    const occurredAt = body.occurredAt === undefined ? current.occurredAt : normalizeOccurredAt(body.occurredAt)
    const note = body.note === undefined ? current.note : optionalText(body.note, 'Note', MAX_NOTE)
    const valuesChanged = body.values !== undefined || templateId !== current.templateId
    let values = current.values
    let media = new Map()
    if (valuesChanged) {
      values = normalizeValues(body.values === undefined ? current.values : body.values, template.fields)
      assertRequiredFields(template.fields, values)
      media = collectMediaValues(values, template.fields)
      assertMediaFiles(media, files, recordId)
    }
    const next = {
      ...current,
      nodeId,
      templateId,
      title,
      severity,
      occurredAt,
      note,
      values,
      updatedAt: new Date().toISOString(),
    }
    await provider.putRecords([next])
    const links = linkedFileUpdates(files, media, recordId)
    if (links.length > 0) await provider.putFiles(links)
    if (valuesChanged) {
      const previous = new Set(files.filter(file => file.recordId === recordId).map(file => file.id))
      for (const fileId of referencedFileIds(current.values)) previous.add(fileId)
      const kept = new Set(media.keys())
      await this.removeFileRows([...previous].filter(fileId => !kept.has(fileId)))
    }
    const after = await provider.files()
    return projectRecord(next, template, after)
  }

  /**
   * Delete one record and every file it references.
   * @param id - record id.
   * @returns the removed record id.
   */
  async deleteRecord(id) {
    const recordId = normalizeId(id, 'Record id')
    const provider = this.storage.provider()
    const [records, files] = await Promise.all([provider.records(), provider.files()])
    const current = records.find(record => record.id === recordId)
    if (current === undefined) throw new AlertError('not-found', 'The alert record was not found', 404)
    const fileIds = new Set(files.filter(file => file.recordId === recordId).map(file => file.id))
    for (const fileId of referencedFileIds(current.values)) fileIds.add(fileId)
    await this.removeFileRows([...fileIds])
    await provider.dropRecords([recordId])
    return recordId
  }

  /**
   * Store one uploaded file immediately; the saved record links it later.
   * @param input - `{ fieldKey, name, contentType, bytes }`.
   * @returns the stored file projection.
   */
  async uploadFile(input) {
    const body = isRecord(input) ? input : {}
    const contentType = normalizeContentType(body.contentType)
    const bytes = body.bytes
    if (!(bytes instanceof Uint8Array)) {
      throw new AlertError('invalid-input', 'The uploaded file bytes are required', 400)
    }
    const limit = this.uploadLimit()
    if (bytes.length > limit) {
      throw new AlertError('too-large', `The uploaded file exceeds the ${this.config.maxUploadMb} MB limit`, 413)
    }
    const fieldKey = optionalText(body.fieldKey, 'Field key', MAX_FIELD_KEY)
    const id = randomUUID()
    const name = normalizeFileName(body.name, id)
    const provider = this.storage.provider()
    await this.pruneAnonymousFiles(provider)
    const file = {
      id,
      recordId: '',
      fieldKey,
      kind: kindOfContentType(contentType),
      name,
      contentType,
      sizeBytes: bytes.length,
      storage: 'local',
      objectKey: '',
      localPath: '',
      createdAt: new Date().toISOString(),
    }
    const stored = { ...file, ...await storeMediaBytes(this.ctx, this.config, file, bytes) }
    try {
      await provider.putFiles([stored])
    } catch (error) {
      await removeMediaObject(this.ctx, stored).catch(() => {})
      throw error
    }
    return projectFile(stored)
  }

  /**
   * Stream one stored file, honouring Range requests for media seeking.
   * @param request - Fetch request with an `id` query parameter.
   * @param download - Whether to send an attachment Content-Disposition.
   * @returns the byte response.
   */
  async fileResponse(request, download) {
    const fileId = normalizeId(requestUrl(request).searchParams.get('id') ?? '', 'File id')
    const provider = this.storage.provider()
    const file = (await provider.files()).find(candidate => candidate.id === fileId)
    if (file === undefined) throw new AlertError('not-found', 'The requested file was not found', 404)
    if (file.storage === 'minio') {
      const database = databaseOf(this.ctx)
      if (database === undefined) {
        throw new AlertError('storage-unavailable', 'MinIO is not available because the database plugin is not installed', 503)
      }
      const bucket = database.minio().bucket
      let stream
      let size = 0
      let range
      try {
        await database.withMinio(async (client) => {
          const info = await client.statObject(bucket, file.objectKey)
          size = Number(info.size ?? 0)
          range = rangeOf(request, size)
          if (range !== undefined && range.invalid) {
            throw new AlertError('invalid-range', 'The requested byte range is not satisfiable', 416)
          }
          stream = range === undefined
            ? await client.getObject(bucket, file.objectKey)
            : await client.getPartialObject(bucket, file.objectKey, range.start, range.length)
        })
      } catch (error) {
        if (isRecord(error) && (error.code === 'NoSuchKey' || error.code === 'NotFound')) {
          throw new AlertError('not-found', 'The stored file object was not found', 404)
        }
        throw storageError('Reading the stored file', error)
      }
      return new Response(Readable.toWeb(stream), {
        status: range === undefined ? 200 : 206,
        headers: mediaHeaders(file, size, range, download),
      })
    }
    if (file.localPath === '') throw new AlertError('not-found', 'The requested file was not found', 404)
    let info
    try {
      info = await stat(file.localPath)
    } catch (error) {
      if (isMissingFile(error)) throw new AlertError('not-found', 'The stored file was not found on disk', 404)
      throw storageError('Reading the stored file', error)
    }
    const range = rangeOf(request, info.size)
    if (range !== undefined && range.invalid) {
      throw new AlertError('invalid-range', 'The requested byte range is not satisfiable', 416)
    }
    const stream = createReadStream(
      file.localPath,
      range === undefined ? undefined : { start: range.start, end: range.end },
    )
    return new Response(Readable.toWeb(stream), {
      status: range === undefined ? 200 : 206,
      headers: mediaHeaders(file, info.size, range, download),
    })
  }

  /**
   * Delete file metadata and its stored bytes. Storage failures are logged and
   * never block metadata cleanup.
   * @param ids - file ids to remove.
   */
  async removeFileRows(ids) {
    const unique = [...new Set(ids)]
    if (unique.length === 0) return
    const provider = this.storage.provider()
    const files = await provider.files()
    const byId = new Map(files.map(file => [file.id, file]))
    const doomed = unique.map(id => byId.get(id)).filter(file => file !== undefined)
    for (const file of doomed) {
      try {
        await removeMediaObject(this.ctx, file)
      } catch (error) {
        this.ctx.logger?.warn?.('dsh-record: removing stored media %s failed: %s', file.id, messageOf(error))
      }
    }
    if (doomed.length > 0) await provider.dropFiles(doomed.map(file => file.id))
  }

  /**
   * Delete anonymous uploads older than 24 hours.
   * @param provider - active storage provider.
   */
  async pruneAnonymousFiles(provider) {
    try {
      const files = await provider.files()
      const cutoff = Date.now() - ANONYMOUS_TTL_MS
      const stale = files.filter(file => file.recordId === '' && Date.parse(file.createdAt) < cutoff)
      if (stale.length === 0) return
      for (const file of stale) {
        try {
          await removeMediaObject(this.ctx, file)
        } catch (error) {
          this.ctx.logger?.warn?.('dsh-record: removing stale upload %s failed: %s', file.id, messageOf(error))
        }
      }
      await provider.dropFiles(stale.map(file => file.id))
    } catch (error) {
      this.ctx.logger?.warn?.('dsh-record: cleaning stale uploads failed: %s', messageOf(error))
    }
  }
}

/** Reject a duplicate directory name under the same parent. */
function assertDirectoryNameFree(nodes, parentId, name, excludeId) {
  const wanted = name.toLocaleLowerCase()
  const duplicate = nodes.find((node) => {
    if (node.id === excludeId || node.parentId !== parentId) return false
    return node.name.toLocaleLowerCase() === wanted
  })
  if (duplicate !== undefined) {
    throw new AlertError('duplicate-name', `A directory named "${name}" already exists here`, 409)
  }
}

/** Map one failure to a JSON error response. */
function errorResponse(ctx, error) {
  const message = messageOf(error)
  if (error instanceof AlertError) return json({ error: error.code, message }, error.status)
  if (isRecord(error) && error.code === 'DATABASE_UNAVAILABLE') {
    return json({
      error: 'database-unavailable',
      message: 'The database plugin is installed but its PostgreSQL or MinIO backend is unavailable. '
        + 'Check the Database connections settings and retry.',
    }, 503)
  }
  ctx.logger?.warn?.('dsh-record: request failed: %s', message)
  return json({ error: 'internal', message }, 500)
}

/** Run one Fetch handler and map its failure to a JSON response. */
function guarded(ctx, handler) {
  return Promise.resolve()
    .then(handler)
    .catch(error => errorResponse(ctx, error))
}

/**
 * Register the authenticated Fetch routes used by the browser page.
 * @param ctx - Host context.
 * @param service - alert record service.
 */
function registerRoutes(ctx, service) {
  const routes = [
    {
      path: `${API}/tree`,
      methods: ['GET'],
      requestBody: 'buffered',
      fetch: () => guarded(ctx, () => service.tree().then(result => json(result))),
    },
    {
      path: `${API}/nodes`,
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: request => guarded(ctx, async () => {
        const body = await readJsonBody(request)
        if (body.action === 'create') return json({ node: await service.createDirectory(body) })
        if (body.action === 'update') return json({ node: await service.updateDirectory(body) })
        if (body.action === 'delete') return json({ removed: await service.deleteDirectory(body.id) })
        throw new AlertError('invalid-input', 'Unknown directory action', 400)
      }),
    },
    {
      path: `${API}/templates`,
      methods: ['GET', 'POST'],
      requestBody: 'buffered',
      fetch: request => guarded(ctx, async () => {
        if (request.method === 'GET') {
          const nodeId = requestUrl(request).searchParams.get('nodeId') ?? ''
          if (nodeId.trim() === '') throw new AlertError('invalid-input', 'nodeId is required', 400)
          return json({ templates: await service.listTemplates(nodeId) })
        }
        const body = await readJsonBody(request)
        if (body.action === 'create') return json({ template: await service.createTemplate(body) })
        if (body.action === 'update') return json({ template: await service.updateTemplate(body) })
        if (body.action === 'delete') return json({ removed: await service.deleteTemplate(body.id) })
        throw new AlertError('invalid-input', 'Unknown template action', 400)
      }),
    },
    {
      path: `${API}/records`,
      methods: ['GET', 'POST'],
      requestBody: 'buffered',
      fetch: request => guarded(ctx, async () => {
        if (request.method === 'GET') {
          const query = requestUrl(request).searchParams
          return json(await service.listRecords({
            nodeId: query.get('nodeId') ?? '',
            templateId: query.get('templateId') ?? '',
            query: query.get('query') ?? '',
            limit: query.get('limit') ?? '',
            offset: query.get('offset') ?? '',
          }))
        }
        const body = await readJsonBody(request)
        if (body.action === 'create') return json({ record: await service.createRecord(body.record) })
        if (body.action === 'update') return json({ record: await service.updateRecord(body.id, body.record) })
        if (body.action === 'delete') return json({ removed: await service.deleteRecord(body.id) })
        throw new AlertError('invalid-input', 'Unknown record action', 400)
      }),
    },
    {
      path: `${API}/upload`,
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: request => guarded(ctx, async () => {
        const query = requestUrl(request).searchParams
        const limit = service.uploadLimit()
        const declared = Number(request.headers.get('content-length') ?? '')
        if (Number.isFinite(declared) && declared > limit) {
          throw new AlertError(
            'too-large',
            `The uploaded file exceeds the ${Math.floor(limit / (1024 * 1024))} MB limit`,
            413,
          )
        }
        const bytes = Buffer.from(await request.arrayBuffer())
        if (bytes.length > limit) {
          throw new AlertError(
            'too-large',
            `The uploaded file exceeds the ${Math.floor(limit / (1024 * 1024))} MB limit`,
            413,
          )
        }
        const file = await service.uploadFile({
          fieldKey: query.get('fieldKey') ?? '',
          name: query.get('name') ?? '',
          contentType: request.headers.get('content-type') ?? 'application/octet-stream',
          bytes,
        })
        return json({ file })
      }),
    },
    {
      path: `${API}/file/content`,
      methods: ['GET'],
      requestBody: 'buffered',
      fetch: request => guarded(ctx, () => service.fileResponse(request, false)),
    },
    {
      path: `${API}/file/download`,
      methods: ['GET'],
      requestBody: 'buffered',
      fetch: request => guarded(ctx, () => service.fileResponse(request, true)),
    },
  ]

  ctx.inject(['connection'], (child) => {
    child.effect(() => {
      const disposers = routes.map(route => child.connection.fetch.register(route))
      return () => { for (const dispose of disposers) void dispose() }
    }, 'dsh-record: Fetch routes')
  })
}

const DIRECTORY_PROPERTIES = {
  id: { type: 'string', required: true },
  parentId: { type: 'string' },
  name: { type: 'string', required: true },
  description: { type: 'string', required: true },
  templateCount: { type: 'integer', required: true },
  recordCount: { type: 'integer', required: true },
}

const FIELD_PROPERTIES = {
  key: { type: 'string', required: true },
  label: { type: 'string', required: true },
  type: { type: 'string', required: true, enum: FIELD_TYPES },
  unit: { type: 'string', required: true },
  required: { type: 'boolean', required: true },
}

const TEMPLATE_PROPERTIES = {
  id: { type: 'string', required: true },
  nodeId: { type: 'string', required: true },
  name: { type: 'string', required: true },
  description: { type: 'string', required: true },
  recordCount: { type: 'integer', required: true },
  fields: {
    type: 'array',
    required: true,
    items: { type: 'object', additionalProperties: false, properties: FIELD_PROPERTIES },
  },
}

const RECORD_PROPERTIES = {
  id: { type: 'string', required: true },
  nodeId: { type: 'string', required: true },
  templateId: { type: 'string', required: true },
  templateName: { type: 'string', required: true },
  title: { type: 'string', required: true },
  severity: { type: 'string', required: true },
  occurredAt: { type: 'string', required: true },
  note: { type: 'string', required: true },
  values: { type: 'json', required: true },
  fileCount: { type: 'integer', required: true },
}

/** @returns one directory for a tool result, omitting a null parent. */
function toolDirectory(directory) {
  const value = {
    id: directory.id,
    name: directory.name,
    description: directory.description,
    templateCount: directory.templateCount,
    recordCount: directory.recordCount,
  }
  if (directory.parentId !== null) value.parentId = directory.parentId
  return value
}

/** @returns one template for a tool result. */
function toolTemplate(template) {
  return {
    id: template.id,
    nodeId: template.nodeId,
    name: template.name,
    description: template.description,
    recordCount: template.recordCount,
    fields: template.fields.map(field => ({
      key: field.key,
      label: field.label,
      type: field.type,
      unit: field.unit,
      required: field.required,
    })),
  }
}

/** @returns one record for a tool result without file bytes. */
function toolRecord(record) {
  return {
    id: record.id,
    nodeId: record.nodeId,
    templateId: record.templateId,
    templateName: record.templateName,
    title: record.title,
    severity: record.severity,
    occurredAt: record.occurredAt,
    note: record.note,
    values: record.values,
    fileCount: record.files.length,
  }
}

const FILE_PROPERTIES = {
  id: { type: 'string', required: true },
  fieldKey: { type: 'string', required: true },
  kind: { type: 'string', required: true },
  name: { type: 'string', required: true },
  contentType: { type: 'string', required: true },
  sizeBytes: { type: 'integer', required: true },
  storage: { type: 'string', required: true },
  contentUrl: { type: 'string', required: true },
  downloadUrl: { type: 'string', required: true },
}

/** @returns one stored file for a tool result. */
function toolFile(file) {
  return {
    id: file.id,
    fieldKey: file.fieldKey,
    kind: file.kind,
    name: file.name,
    contentType: file.contentType,
    sizeBytes: file.sizeBytes,
    storage: file.storage,
    contentUrl: file.contentUrl,
    downloadUrl: file.downloadUrl,
  }
}

/** @returns one record with its stored files for a tool result. */
function toolRecordDetail(record) {
  return {
    ...toolRecord(record),
    files: record.files.map(toolFile),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

/**
 * Register the model tools that read and write the alert record library.
 * @param ctx - Host context.
 * @param service - alert record service.
 */
function registerTools(ctx, service) {
  ctx.inject(['tools'], (child) => {
    child.effect(() => {
      const disposers = [
        child.tools.register(defineTool({
          name: 'list_alert_directories',
          description: 'List every directory in the alert record library. '
            + 'Returns each directory id, parent id, name, description, template count, and record count. '
            + 'Use the ids with list_alert_templates, list_alert_records, or create_alert_directory.',
          parameters: {},
          output: {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                total: { type: 'integer', required: true },
                directories: {
                  type: 'array',
                  required: true,
                  items: { type: 'object', additionalProperties: false, properties: DIRECTORY_PROPERTIES },
                },
              },
            },
            render: (_args, value) => [{
              type: 'text',
              text: value.total === 0
                ? 'The alert record library is empty.'
                : `Alert directories (${String(value.total)}):\n`
                  + value.directories.map(directory => `- id=${directory.id} parent=${directory.parentId ?? 'root'} name=${JSON.stringify(directory.name)} templates=${String(directory.templateCount)} records=${String(directory.recordCount)}`).join('\n'),
            }],
          },
          presentCall: () => ({ card: 'generic', kind: 'search', title: 'List alert directories' }),
          async execute(_args, exec) {
            exec.signal.throwIfAborted()
            const tree = await service.tree()
            exec.signal.throwIfAborted()
            return { total: tree.nodes.length, directories: tree.nodes.map(toolDirectory) }
          },
        })),

        child.tools.register(defineTool({
          name: 'create_alert_directory',
          description: 'Create one directory in the alert record library. '
            + 'The directory appears on the Alert records page and can contain templates and records. '
            + 'Use list_alert_directories first to find a parent id.',
          parameters: {
            parentId: {
              type: 'string',
              description: 'Parent directory id; omit to create a root library.',
            },
            name: { type: 'string', required: true, description: 'Directory name, at most 120 characters.' },
            description: { type: 'string', description: 'Optional notes about the directory.' },
          },
          output: {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                directory: {
                  type: 'object',
                  required: true,
                  additionalProperties: false,
                  properties: DIRECTORY_PROPERTIES,
                },
              },
            },
            render: (_args, value) => [{
              type: 'text',
              text: `Created alert directory "${value.directory.name}" (id ${value.directory.id}).`,
            }],
          },
          presentCall: args => ({
            card: 'generic',
            kind: 'edit',
            title: `Create alert directory "${args.name}"`,
            rawInput: { parentId: args.parentId, description: args.description },
          }),
          presentResult: (args, result) => result.isError ? undefined : ({
            card: 'generic',
            title: `Created alert directory "${args.name}"`,
          }),
          async execute(args, exec) {
            exec.signal.throwIfAborted()
            const directory = await service.createDirectory(args)
            exec.signal.throwIfAborted()
            return { directory: toolDirectory(directory) }
          },
        })),

        child.tools.register(defineTool({
          name: 'list_alert_templates',
          description: 'List alert record templates. '
            + 'Returns each template id, directory id, name, description, record count, and field definitions. '
            + 'Use the field keys when creating a record, and the template id with create_alert_record.',
          parameters: {
            nodeId: {
              type: 'string',
              description: 'Directory id to list; omit to list templates from every directory.',
            },
          },
          output: {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                total: { type: 'integer', required: true },
                templates: {
                  type: 'array',
                  required: true,
                  items: { type: 'object', additionalProperties: false, properties: TEMPLATE_PROPERTIES },
                },
              },
            },
            render: (_args, value) => [{
              type: 'text',
              text: value.total === 0
                ? 'No alert templates were found.'
                : `Alert templates (${String(value.total)}):\n`
                  + value.templates.map(template => `- id=${template.id} directory=${template.nodeId} name=${JSON.stringify(template.name)} records=${String(template.recordCount)} fields=`
                    + template.fields.map(field => `${field.key}:${field.type}:${field.label}${field.unit === '' ? '' : `(${field.unit})`}`).join(', ')).join('\n'),
            }],
          },
          presentCall: args => ({
            card: 'generic',
            kind: 'search',
            title: args.nodeId === undefined || args.nodeId === ''
              ? 'List alert templates'
              : `List alert templates for ${args.nodeId}`,
          }),
          async execute(args, exec) {
            exec.signal.throwIfAborted()
            const templates = await service.listTemplates(args.nodeId ?? '')
            exec.signal.throwIfAborted()
            return { total: templates.length, templates: templates.map(toolTemplate) }
          },
        })),

        child.tools.register(defineTool({
          name: 'create_alert_template',
          description: 'Create one template that describes the fields of alert records in a directory. '
            + 'Fields define the form the page shows; a number field stores numbers, a text field stores strings, '
            + 'and image, video, and audio fields store uploaded file ids. '
            + 'Use list_alert_directories first to find the directory id.',
          parameters: {
            nodeId: { type: 'string', required: true, description: 'Directory id that owns the template.' },
            name: { type: 'string', required: true, description: 'Template name, at most 120 characters.' },
            description: { type: 'string', description: 'Optional notes about the template.' },
            fields: {
              type: 'array',
              required: true,
              description: 'Form fields, at least one and at most 40.',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  label: {
                    type: 'string',
                    required: true,
                    description: 'Field label shown on the form, at most 60 characters.',
                  },
                  type: {
                    type: 'string',
                    required: true,
                    enum: FIELD_TYPES,
                    description: 'Value type: number, text, image, video, or audio.',
                  },
                  unit: {
                    type: 'string',
                    description: 'Unit shown after a number value, at most 20 characters.',
                  },
                  required: {
                    type: 'boolean',
                    description: 'Whether the field is marked as required on the form.',
                  },
                },
              },
            },
          },
          output: {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                template: {
                  type: 'object',
                  required: true,
                  additionalProperties: false,
                  properties: TEMPLATE_PROPERTIES,
                },
              },
            },
            render: (_args, value) => [{
              type: 'text',
              text: `Created alert template "${value.template.name}" (id ${value.template.id}) with ${String(value.template.fields.length)} field(s): `
                + value.template.fields.map(field => `${field.key}:${field.type}:${field.label}`).join(', '),
            }],
          },
          presentCall: args => ({
            card: 'generic',
            kind: 'edit',
            title: `Create alert template "${args.name}"`,
            rawInput: { nodeId: args.nodeId, fields: args.fields },
          }),
          presentResult: (args, result) => result.isError ? undefined : ({
            card: 'generic',
            title: `Created alert template "${args.name}"`,
          }),
          async execute(args, exec) {
            exec.signal.throwIfAborted()
            const template = await service.createTemplate(args)
            exec.signal.throwIfAborted()
            return { template: toolTemplate(template) }
          },
        })),

        child.tools.register(defineTool({
          name: 'list_alert_records',
          description: 'List alert records, newest occurrence first. '
            + 'Returns each record id, directory id, template id and name, title, severity, occurred time, note, '
            + 'field values, and file count. '
            + 'Use the ids with delete_alert_record.',
          parameters: {
            nodeId: { type: 'string', description: 'Directory id to filter by.' },
            templateId: { type: 'string', description: 'Template id to filter by.' },
            query: { type: 'string', description: 'Case-insensitive text matched against title, note, and values.' },
            limit: { type: 'integer', description: 'Maximum records to return, 1-200. Defaults to 50.' },
          },
          output: {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                total: { type: 'integer', required: true },
                records: {
                  type: 'array',
                  required: true,
                  items: { type: 'object', additionalProperties: false, properties: RECORD_PROPERTIES },
                },
              },
            },
            render: (_args, value) => [{
              type: 'text',
              text: value.total === 0
                ? 'No alert records matched.'
                : `Alert records (${String(value.records.length)} shown of ${String(value.total)}):\n`
                  + value.records.map(record => `- id=${record.id} title=${JSON.stringify(record.title)} severity=${record.severity || 'none'} occurred=${record.occurredAt} template=${JSON.stringify(record.templateName)} files=${String(record.fileCount)} values=${JSON.stringify(record.values)}`).join('\n'),
            }],
          },
          presentCall: () => ({ card: 'generic', kind: 'search', title: 'List alert records' }),
          async execute(args, exec) {
            exec.signal.throwIfAborted()
            const limit = Math.min(Math.max(args.limit ?? 50, 1), 200)
            const result = await service.listRecords({
              nodeId: args.nodeId ?? '',
              templateId: args.templateId ?? '',
              query: args.query ?? '',
              limit,
              offset: 0,
            })
            exec.signal.throwIfAborted()
            return { total: result.total, records: result.records.map(toolRecord) }
          },
        })),

        child.tools.register(defineTool({
          name: 'create_alert_record',
          description: 'Create one alert record from an existing template. '
            + 'Values are keyed by template field key: number fields take JSON numbers and text fields take strings. '
            + 'Omit image, video, and audio fields because media files must be uploaded from the page. '
            + 'Use list_alert_templates first to read the field keys.',
          parameters: {
            nodeId: { type: 'string', required: true, description: 'Directory id that owns the record.' },
            templateId: { type: 'string', required: true, description: 'Template id the record follows.' },
            title: { type: 'string', required: true, description: 'Record title, at most 160 characters.' },
            severity: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Severity of the alert; omit for no severity.',
            },
            occurredAt: {
              type: 'string',
              description: 'ISO 8601 timestamp when the alert occurred; omit for now.',
            },
            note: { type: 'string', description: 'Optional note, at most 4000 characters.' },
            values: {
              type: 'json',
              description: 'Field values keyed by template field key. Number fields take JSON numbers, '
                + 'text fields take strings, and media fields must be omitted.',
            },
          },
          output: {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                record: {
                  type: 'object',
                  required: true,
                  additionalProperties: false,
                  properties: RECORD_PROPERTIES,
                },
              },
            },
            render: (_args, value) => [{
              type: 'text',
              text: `Created alert record "${value.record.title}" (id ${value.record.id}) with severity ${value.record.severity || 'none'} at ${value.record.occurredAt}.`,
            }],
          },
          presentCall: args => ({
            card: 'generic',
            kind: 'edit',
            title: `Create alert record "${args.title}"`,
            rawInput: {
              nodeId: args.nodeId,
              templateId: args.templateId,
              severity: args.severity,
              occurredAt: args.occurredAt,
            },
          }),
          presentResult: (args, result) => result.isError ? undefined : ({
            card: 'generic',
            title: `Created alert record "${args.title}"`,
          }),
          async execute(args, exec) {
            exec.signal.throwIfAborted()
            const record = await service.createRecord(args)
            exec.signal.throwIfAborted()
            return { record: toolRecord(record) }
          },
        })),

        child.tools.register(defineTool({
          name: 'delete_alert_record',
          description: 'Delete one alert record and its uploaded files by id. '
            + 'Use list_alert_records first when you do not know the record id.',
          parameters: {
            id: { type: 'string', required: true, description: 'Alert record id to delete.' },
          },
          output: {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                id: { type: 'string', required: true },
              },
            },
            render: (_args, value) => [{ type: 'text', text: `Deleted alert record id ${value.id}.` }],
          },
          presentCall: args => ({ card: 'generic', kind: 'delete', title: `Delete alert record ${args.id}` }),
          presentResult: (args, result) => result.isError ? undefined : ({
            card: 'generic',
            title: `Deleted alert record ${args.id}`,
          }),
          async execute(args, exec) {
            exec.signal.throwIfAborted()
            const id = await service.deleteRecord(args.id)
            exec.signal.throwIfAborted()
            return { id }
          },
        })),

        child.tools.register(defineTool({
          name: 'get_alert_record',
          description: 'Read one alert record by id, including every field value and each stored image, video, '
            + 'or audio file with its relative content and download URL. '
            + 'Use list_alert_records first to find the record id.',
          parameters: {
            id: { type: 'string', required: true, description: 'Alert record id.' },
          },
          output: {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                record: {
                  type: 'object',
                  required: true,
                  additionalProperties: false,
                  properties: {
                    id: { type: 'string', required: true },
                    nodeId: { type: 'string', required: true },
                    templateId: { type: 'string', required: true },
                    templateName: { type: 'string', required: true },
                    title: { type: 'string', required: true },
                    severity: { type: 'string', required: true },
                    occurredAt: { type: 'string', required: true },
                    note: { type: 'string', required: true },
                    values: { type: 'json', required: true },
                    fileCount: { type: 'integer', required: true },
                    files: {
                      type: 'array',
                      required: true,
                      items: { type: 'object', additionalProperties: false, properties: FILE_PROPERTIES },
                    },
                    createdAt: { type: 'string', required: true },
                    updatedAt: { type: 'string', required: true },
                  },
                },
              },
            },
            render: (_args, value) => {
              const record = value.record
              const files = record.files.length === 0
                ? 'none'
                : record.files.map(file => `${file.kind}:${file.name}`).join(', ')
              return [{
                type: 'text',
                text: `Alert record "${record.title}" (id ${record.id}, template ${record.templateName || record.templateId})\n`
                  + `severity=${record.severity || 'none'} occurred=${record.occurredAt}\n`
                  + `values=${JSON.stringify(record.values)}\n`
                  + `note=${JSON.stringify(record.note)}\n`
                  + `files=${files}`,
              }]
            },
          },
          presentCall: args => ({ card: 'generic', kind: 'search', title: `Read alert record ${args.id}` }),
          async execute(args, exec) {
            exec.signal.throwIfAborted()
            const record = await service.getRecord(args.id)
            exec.signal.throwIfAborted()
            return { record: toolRecordDetail(record) }
          },
        })),

        child.tools.register(defineTool({
          name: 'update_alert_record',
          description: 'Update one alert record. Omitted fields keep their value. A supplied `values` object '
            + 'replaces the whole value map, keyed by template field key; number fields take numbers and text '
            + 'fields take strings. Media fields take arrays of file ids returned by upload_alert_file. '
            + 'Use get_alert_record first to read the current values.',
          parameters: {
            id: { type: 'string', required: true, description: 'Alert record id from list_alert_records.' },
            title: { type: 'string', description: 'New title.' },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'New severity.' },
            occurredAt: { type: 'string', description: 'New ISO 8601 occurrence timestamp.' },
            note: { type: 'string', description: 'New note; an empty string clears it.' },
            values: { type: 'json', description: 'Complete replacement value map keyed by template field key.' },
          },
          output: {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                record: { type: 'object', required: true, additionalProperties: false, properties: RECORD_PROPERTIES },
              },
            },
            render: (_args, value) => [{ type: 'text', text: `Updated alert record "${value.record.title}" (id ${value.record.id}).` }],
          },
          presentCall: args => ({ card: 'generic', kind: 'edit', title: `Update alert record ${args.id}` }),
          presentResult: (args, result) => result.isError ? undefined : ({
            card: 'generic',
            title: `Updated alert record ${args.id}`,
          }),
          async execute(args, exec) {
            exec.signal.throwIfAborted()
            const record = await service.updateRecord(args.id, args)
            exec.signal.throwIfAborted()
            return { record: toolRecord(record) }
          },
        })),

        child.tools.register(defineTool({
          name: 'update_alert_directory',
          description: 'Rename one alert library directory or change its description. '
            + 'Omitted fields keep their value. Use list_alert_directories first to find the directory id.',
          parameters: {
            id: { type: 'string', required: true, description: 'Directory id from list_alert_directories.' },
            name: { type: 'string', description: 'New directory name, unique under its parent.' },
            description: { type: 'string', description: 'New description; an empty string clears it.' },
          },
          output: {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                directory: { type: 'object', required: true, additionalProperties: false, properties: DIRECTORY_PROPERTIES },
              },
            },
            render: (_args, value) => [{ type: 'text', text: `Updated alert library "${value.directory.name}" (id ${value.directory.id}).` }],
          },
          presentCall: args => ({ card: 'generic', kind: 'edit', title: `Update alert library ${args.id}` }),
          presentResult: (args, result) => result.isError ? undefined : ({
            card: 'generic',
            title: `Updated alert library ${args.id}`,
          }),
          async execute(args, exec) {
            exec.signal.throwIfAborted()
            const directory = await service.updateDirectory(args)
            exec.signal.throwIfAborted()
            return { directory: toolDirectory(directory) }
          },
        })),

        child.tools.register(defineTool({
          name: 'delete_alert_directory',
          description: 'Delete one alert library directory together with its child libraries, templates, '
            + 'records, and stored files. This cannot be undone; prefer deleting single records when the '
            + 'directory should stay.',
          parameters: {
            id: { type: 'string', required: true, description: 'Directory id from list_alert_directories.' },
          },
          output: {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: { id: { type: 'string', required: true } },
            },
            render: (_args, value) => [{ type: 'text', text: `Deleted alert library id ${value.id} with everything inside it.` }],
          },
          presentCall: args => ({ card: 'generic', kind: 'delete', title: `Delete alert library ${args.id}` }),
          presentResult: (args, result) => result.isError ? undefined : ({
            card: 'generic',
            title: `Deleted alert library ${args.id}`,
          }),
          async execute(args, exec) {
            exec.signal.throwIfAborted()
            const id = await service.deleteDirectory(args.id)
            exec.signal.throwIfAborted()
            return { id }
          },
        })),

        child.tools.register(defineTool({
          name: 'update_alert_template',
          description: 'Update one alert template. Omitted fields keep their value. A supplied `fields` array '
            + 'replaces the whole field list; keep each field `key` from list_alert_templates to preserve the '
            + 'values already stored under it. A field type cannot change while records use the template.',
          parameters: {
            id: { type: 'string', required: true, description: 'Template id from list_alert_templates.' },
            name: { type: 'string', description: 'New template name.' },
            description: { type: 'string', description: 'New description; an empty string clears it.' },
            fields: {
              type: 'array',
              description: 'Complete replacement field list. At least one field.',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  key: { type: 'string', description: 'Existing field key to keep; omit to assign a new one.' },
                  label: { type: 'string', required: true, description: 'Field label.' },
                  type: { type: 'string', required: true, enum: FIELD_TYPES, description: 'Field type.' },
                  unit: { type: 'string', description: 'Unit after a number value.' },
                  required: { type: 'boolean', description: 'Whether a record must provide this field.' },
                },
              },
            },
          },
          output: {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                template: { type: 'object', required: true, additionalProperties: false, properties: TEMPLATE_PROPERTIES },
              },
            },
            render: (_args, value) => [{ type: 'text', text: `Updated alert template "${value.template.name}" (id ${value.template.id}).` }],
          },
          presentCall: args => ({ card: 'generic', kind: 'edit', title: `Update alert template ${args.id}` }),
          presentResult: (args, result) => result.isError ? undefined : ({
            card: 'generic',
            title: `Updated alert template ${args.id}`,
          }),
          async execute(args, exec) {
            exec.signal.throwIfAborted()
            const template = await service.updateTemplate(args)
            exec.signal.throwIfAborted()
            return { template: toolTemplate(template) }
          },
        })),

        child.tools.register(defineTool({
          name: 'delete_alert_template',
          description: 'Delete one alert template. A template that still has records is refused, so delete '
            + 'those records first. Use list_alert_templates to find the template id.',
          parameters: {
            id: { type: 'string', required: true, description: 'Template id from list_alert_templates.' },
          },
          output: {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: { id: { type: 'string', required: true } },
            },
            render: (_args, value) => [{ type: 'text', text: `Deleted alert template id ${value.id}.` }],
          },
          presentCall: args => ({ card: 'generic', kind: 'delete', title: `Delete alert template ${args.id}` }),
          presentResult: (args, result) => result.isError ? undefined : ({
            card: 'generic',
            title: `Deleted alert template ${args.id}`,
          }),
          async execute(args, exec) {
            exec.signal.throwIfAborted()
            const id = await service.deleteTemplate(args.id)
            exec.signal.throwIfAborted()
            return { id }
          },
        })),

        child.tools.register(defineTool({
          name: 'upload_alert_file',
          description: 'Upload one image, video, or audio file for an alert record and return its file id. '
            + 'Pass the id in a media field value (an array of ids) of create_alert_record or update_alert_record. '
            + '`data` is base64, with or without a data URL prefix. The content URLs in the result are relative '
            + 'to the Harness Web origin.',
          parameters: {
            data: { type: 'string', required: true, description: 'Base64 file bytes, optionally as a data URL.' },
            contentType: { type: 'string', required: true, description: 'Media type, such as image/png or video/mp4.' },
            name: { type: 'string', description: 'Original file name, including its extension.' },
            fieldKey: { type: 'string', description: 'Template field key that will hold this file.' },
          },
          output: {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                file: { type: 'object', required: true, additionalProperties: false, properties: FILE_PROPERTIES },
              },
            },
            render: (_args, value) => [{
              type: 'text',
              text: `Uploaded ${value.file.kind} "${value.file.name}" (id ${value.file.id}, ${value.file.sizeBytes} bytes).`,
            }],
          },
          presentCall: args => ({ card: 'generic', kind: 'edit', title: `Upload ${args.contentType} file for an alert record` }),
          presentResult: (args, result) => result.isError ? undefined : ({
            card: 'generic',
            title: `Uploaded alert file ${result.value?.file?.name ?? ''}`.trim(),
          }),
          async execute(args, exec) {
            exec.signal.throwIfAborted()
            const raw = typeof args.data === 'string' ? args.data.trim() : ''
            const match = /^data:[^;,]*;base64,(.*)$/s.exec(raw)
            const bytes = Buffer.from(match === null ? raw : match[1], 'base64')
            if (bytes.length === 0) throw new Error('The file data is not valid base64')
            const file = await service.uploadFile({
              fieldKey: args.fieldKey ?? '',
              name: args.name ?? '',
              contentType: args.contentType,
              bytes,
            })
            exec.signal.throwIfAborted()
            return { file: toolFile(file) }
          },
        })),
      ]
      return () => { for (const dispose of disposers) dispose() }
    }, 'dsh-record: tools')
  })
}

/**
 * Register the alert record service, its Fetch routes, and its model tools.
 * @param ctx - Host context.
 * @param config - Resolved plugin configuration.
 */
export function apply(ctx, config) {
  const service = new AlertRecordsService(ctx, config)
  registerRoutes(ctx, service)
  registerTools(ctx, service)
}
