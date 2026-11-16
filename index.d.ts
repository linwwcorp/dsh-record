/**
 * Types for the `dsh-record` plugin.
 *
 * Another Host plugin injects the shared service:
 *
 * ```ts
 * import type {} from 'dsh-record'
 * export const inject = ['alertRecords']
 * const records = await ctx.alertRecords.listRecords({ nodeId })
 * ```
 */

/** One alert library directory. */
export interface AlertDirectory {
  id: string
  parentId: string | null
  name: string
  description: string
  templateCount: number
  recordCount: number
  createdAt: string
  updatedAt: string
}

/** One template field. */
export interface AlertField {
  /** Stable key record values are stored under. */
  key: string
  label: string
  type: 'number' | 'text' | 'image' | 'video' | 'audio'
  required: boolean
}

/** One alert template. */
export interface AlertTemplate {
  id: string
  nodeId: string
  name: string
  description: string
  fields: AlertField[]
  recordCount: number
  createdAt: string
  updatedAt: string
}

/** One stored image, video, or audio file. */
export interface AlertFile {
  id: string
  recordId: string
  fieldKey: string
  kind: 'image' | 'video' | 'audio' | 'file'
  name: string
  contentType: string
  sizeBytes: number
  storage: 'minio' | 'local'
  createdAt: string
  /** Relative to the Harness Web origin. */
  contentUrl: string
  /** Relative to the Harness Web origin. */
  downloadUrl: string
}

/** One alert record. */
export interface AlertRecord {
  id: string
  nodeId: string
  templateId: string
  templateName: string
  title: string
  severity: '' | 'low' | 'medium' | 'high' | 'critical'
  occurredAt: string
  note: string
  /** Values keyed by template field key; media fields hold arrays of file ids. */
  values: Record<string, number | string | string[]>
  files: AlertFile[]
  createdAt: string
  updatedAt: string
}

/** Writable fields of one directory. */
export interface AlertDirectoryInput {
  id?: string
  parentId?: string | null
  name?: string
  description?: string
}

/** Writable fields of one template. */
export interface AlertTemplateInput {
  id?: string
  nodeId?: string
  name?: string
  description?: string
  fields?: Array<Partial<AlertField> & { label: string; type: AlertField['type'] }>
}

/** Writable fields of one record. */
export interface AlertRecordInput {
  id?: string
  nodeId?: string
  templateId?: string
  title?: string
  severity?: '' | 'low' | 'medium' | 'high' | 'critical'
  occurredAt?: string
  note?: string
  values?: Record<string, number | string | string[]>
}

/** One stored record filter. */
export interface AlertRecordFilter {
  nodeId?: string
  templateId?: string
  query?: string
  limit?: number
  offset?: number
}

/** One file upload. */
export interface AlertFileUpload {
  fieldKey?: string
  name?: string
  contentType: string
  bytes: Uint8Array
}

/** Resolved storage summary. */
export interface AlertRecordSettings {
  mode: 'postgres' | 'local'
  media: 'minio' | 'local'
  maxUploadMb: number
}

/**
 * Alert record library operations shared by the Fetch routes, the model tools,
 * and other Host plugins. Resolve it through `ctx.alertRecords`.
 */
export declare class AlertRecordsService {
  /** @returns every directory with template and record counts, sorted by name. */
  tree(): Promise<{ mode: 'postgres' | 'local'; media: 'minio' | 'local'; nodes: AlertDirectory[] }>
  /** @returns the resolved storage mode and upload limit. */
  settings(): Promise<AlertRecordSettings>
  /** @returns the upload size limit in bytes. */
  uploadLimit(): number
  /** @returns one directory with its template and record counts. */
  getDirectory(id: string): Promise<AlertDirectory>
  /** @returns one template with its record count. */
  getTemplate(id: string): Promise<AlertTemplate>
  /** @returns one record with its field values and stored files. */
  getRecord(id: string): Promise<AlertRecord>
  /** @returns the created directory. */
  createDirectory(input: AlertDirectoryInput): Promise<AlertDirectory>
  /** @returns the updated directory. */
  updateDirectory(input: AlertDirectoryInput): Promise<AlertDirectory>
  /** @returns the removed directory id. */
  deleteDirectory(id: string): Promise<string>
  /** @returns templates of one directory, or every template when nodeId is empty. */
  listTemplates(nodeId?: string): Promise<AlertTemplate[]>
  /** @returns the created template. */
  createTemplate(input: AlertTemplateInput): Promise<AlertTemplate>
  /** @returns the updated template. */
  updateTemplate(input: AlertTemplateInput): Promise<AlertTemplate>
  /** @returns the removed template id. */
  deleteTemplate(id: string): Promise<string>
  /** @returns matching records newest first and the full match count. */
  listRecords(filter?: AlertRecordFilter): Promise<{ records: AlertRecord[]; total: number }>
  /** @returns the created record. */
  createRecord(input: AlertRecordInput): Promise<AlertRecord>
  /** @returns the updated record. */
  updateRecord(id: string, input: AlertRecordInput): Promise<AlertRecord>
  /** @returns the removed record id. */
  deleteRecord(id: string): Promise<string>
  /** @returns the stored file metadata; link it through a media field value. */
  uploadFile(input: AlertFileUpload): Promise<AlertFile>
  /** Streams one stored file response, honouring HTTP Range. */
  fileResponse(request: Request, download: boolean): Promise<Response>
}

/** Registers the service, its Fetch routes, and its model tools. */
export declare function apply(ctx: unknown, config: AlertRecordsConfig): void

/** Plugin configuration. */
export interface AlertRecordsConfig {
  /** Data directory used when no database plugin is installed. */
  localDir: string
  /** Maximum size of one uploaded media file, in megabytes. */
  maxUploadMb: number
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Alert record library operations provided by the dsh-record plugin. */
    alertRecords: AlertRecordsService
  }
}
