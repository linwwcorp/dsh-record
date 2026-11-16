# dsh-record

中文 | [English](#english)

一个 DeepSeek Harness 插件：**预警记录**。用多级目录（每个目录相当于一个库）组织预警模板和预警记录；模板字段支持数字、字符、图片、视频、音频；装了数据库插件就用 PostgreSQL + MinIO，没装就落本地文件和本地目录。

## 功能

- **多级目录**：左侧目录树可任意建子库（厂区 → 车间 → 设备），支持重命名、删除；删除目录会连带删除子目录、模板、记录和媒体文件。
- **可调分栏**：左侧目录栏和右侧内容之间可拖动分隔条调整宽度（键盘方向键也可微调，双击恢复默认），宽度会记住。
- **预警模板**：每个库可以建多个模板，模板由若干字段组成：
  - `数字`：记录时填数值；
  - `字符`：文本；
  - `图片` / `视频` / `音频`：记录时上传媒体文件。
- **预警记录**：选择模板填写标题、发生时间、等级（低 / 中 / 高 / 严重）、备注和字段值；图片可直接预览，视频和音频可在页面播放，所有媒体都能下载。
- **检索与分页**：按模板筛选、按关键字搜索记录；记录按发生时间倒序排列，列表支持页码翻页和每页 20 / 50 / 100 条切换，接口与 Agent 工具同样支持 `limit` / `offset` 分页并返回总数。
- **存储自动降级**：
  - 检测到数据库插件（`dsh-database-config`）→ 目录、模板、记录、文件索引写入 **PostgreSQL**，媒体文件写入 **MinIO**；
  - 没有数据库插件 → 上述数据写入 `$DSH_HOME/dsh-record/data.json`，媒体文件写入 `$DSH_HOME/dsh-record/media/`。
  - 状态徽标会显示当前实际使用的存储方式。
- **Agent 工具（14 个）**：目录 `list_alert_directories` / `create_alert_directory` / `update_alert_directory` / `delete_alert_directory`；模板 `list_alert_templates` / `create_alert_template` / `update_alert_template` / `delete_alert_template`；记录 `list_alert_records` / `get_alert_record` / `create_alert_record` / `update_alert_record` / `delete_alert_record`；媒体 `upload_alert_file`。

## 配置

| 配置 | 默认值 | 说明 |
| --- | --- | --- |
| `localDir` | 空 | 无数据库插件时的数据目录；留空使用 `$DSH_HOME/dsh-record` |
| `maxUploadMb` | `200` | 单个媒体上传大小上限（MB） |

在 `cordis.patch.yml` 或插件配置里修改：

```yaml
- id: dsh-record
  name: dsh-record
  config:
    localDir: ''
    maxUploadMb: 200
```

## 安装

```sh
dsh plugin install /root/CODE/dsh-record
```

或把插件管理里的安装目标设为该目录。安装后在「插件」里启用，左侧栏会出现「预警记录」入口。

## 页面

左侧是库目录树，右侧是选中的库：

- **记录**：按模板筛选、搜索、新建 / 编辑 / 查看 / 删除记录；
- **模板**：新建 / 编辑模板，字段编辑器里可以增删字段、选择字段类型和是否必填。

页头徽标显示当前存储：`PostgreSQL` / `本地文件`，以及 `MinIO` / `本地目录`。

## 存储与接口

| 方式 | 元数据 | 媒体 |
| --- | --- | --- |
| 有数据库插件 | PostgreSQL 表 `dsh_alert_nodes`、`dsh_alert_templates`、`dsh_alert_records`、`dsh_alert_files` | MinIO 对象前缀 `dsh-record/media/`（bucket 用数据库插件里的配置） |
| 无数据库插件 | `data.json` | `<localDir>/media/<fileId><ext>` |

- 媒体文件不暴露公开 URL，一律由插件的认证路由读取；视频和音频支持 HTTP Range（拖动进度条）。
- 数据库插件存在但 PostgreSQL 不可用时，接口返回 `database-unavailable`，页面提示检查数据库插件，不会悄悄改成写本地文件，避免两份数据。
- HTTP 路由前缀 `api/record`：`tree`、`nodes`、`templates`、`records`、`upload`、`file/content`、`file/download`。
- `GET api/record/records` 支持 `limit`（默认 100，最大 500）和 `offset`，响应里的 `total` 是过滤后的总条数，页面用这两个参数做分页。

## 对外开放能力

### 给其他插件（Cordis Service）

插件把全部能力注册为 Cordis Service `alertRecords`，其他 Host 插件和模型工具调用同一套实现：

```js
export const inject = ['alertRecords']

export async function apply(ctx) {
  const { nodes } = await ctx.alertRecords.tree()
  const [template] = await ctx.alertRecords.listTemplates(nodes[0].id)
  const record = await ctx.alertRecords.createRecord({
    nodeId: nodes[0].id,
    templateId: template.id,
    title: '3 号炉温度超限',
    severity: 'high',
    values: { [template.fields[0].key]: 88.6 },
  })
  const full = await ctx.alertRecords.getRecord(record.id)
  const file = await ctx.alertRecords.uploadFile({
    fieldKey: template.fields[0].key,
    name: 'photo.png',
    contentType: 'image/png',
    bytes: pngBytes,
  })
  await ctx.alertRecords.updateRecord(record.id, {
    values: { ...full.values, [template.fields[2].key]: [file.id] },
  })
}
```

TypeScript 插件可以用 `import type {} from 'dsh-record'` 获得 `ctx.alertRecords` 的类型（`index.d.ts`）。

| 方法 | 说明 |
| --- | --- |
| `tree()` | 库目录树（含模板数、记录数） |
| `settings()` / `uploadLimit()` | 当前存储方式与上传上限 |
| `getDirectory(id)` / `createDirectory(input)` / `updateDirectory(input)` / `deleteDirectory(id)` | 库目录 |
| `getTemplate(id)` / `listTemplates(nodeId?)` / `createTemplate(input)` / `updateTemplate(input)` / `deleteTemplate(id)` | 预警模板 |
| `getRecord(id)` / `listRecords(filter)` / `createRecord(input)` / `updateRecord(id, input)` / `deleteRecord(id)` | 预警记录 |
| `uploadFile({ fieldKey, name, contentType, bytes })` | 上传图片/视频/音频，返回文件 id |
| `fileResponse(request, download)` | 输出媒体响应（支持 Range） |

### 给大模型（Agent Tools）

插件注册 14 个模型工具，覆盖目录、模板、记录的完整增删改查和媒体上传：

| 分类 | 工具 |
| --- | --- |
| 目录 | `list_alert_directories`、`create_alert_directory`、`update_alert_directory`、`delete_alert_directory` |
| 模板 | `list_alert_templates`、`create_alert_template`、`update_alert_template`、`delete_alert_template` |
| 记录 | `list_alert_records`（支持 `limit` / `offset` 分页，返回 `total`、`offset`、`hasMore`）、`get_alert_record`、`create_alert_record`、`update_alert_record`、`delete_alert_record` |
| 媒体 | `upload_alert_file`（base64 上传，返回文件 id 后可写入记录的媒体字段） |

典型调用顺序：`list_alert_directories` → `list_alert_templates`（拿到字段 `key`）→ `create_alert_record`（`values` 按字段 key 传数字/字符）→ 需要附件时 `upload_alert_file` → `update_alert_record` 把文件 id 放进媒体字段的数组。

## 结构

| 文件 | 作用 |
| --- | --- |
| `index.js` | Host：存储选择（PostgreSQL / 本地 JSON）、MinIO / 本地媒体、Fetch 路由、Agent 工具 |
| `index.d.ts` | 供其他 TypeScript 插件使用的 `alertRecords` 服务类型 |
| `client.js` | 浏览器：侧边栏入口、库目录树、模板与记录页面、媒体上传与播放 |
| `cordis.patch.yml` | 插入 `dsh-record` 插件行 |
| `locale/*.json` | 插件管理器中的标题与说明 |
| `icon.svg` | 插件图标 |

## 说明

- 模板字段的 `type` 一旦有记录使用就不能改（接口返回 `field-type-in-use`），避免历史数据含义错乱。
- 仍被记录使用的模板不能删除（接口返回 `template-in-use`），请先删除这些记录，避免历史数据丢失字段定义。
- 上传后未保存到记录的匿名文件会在 24 小时后自动清理。

---

<a id="english"></a>

# dsh-record

[中文](#dsh-record) | English

A DeepSeek Harness plugin for **alert records**. Multi-level directories (each one acts as a library) organize alert templates and alert records. Template fields support numbers, text, images, video, and audio. With the database plugin the data goes to PostgreSQL and MinIO; without it everything stays in local files and directories.

## Features

- **Multi-level directories**: build sub-libraries of any depth (site → workshop → device), rename and delete them. Deleting a directory also removes its sub-directories, templates, records, and media files.
- **Resizable split**: drag the separator between the directory column and the content to change the width (arrow keys also work when it has focus, and a double-click restores the default). The width is remembered.
- **Alert templates**: each library holds any number of templates made of fields:
  - `number`;
  - `text`;
  - `image`, `video`, and `audio` fields that take uploaded media.
- **Alert records**: pick a template and fill in a title, occurrence time, severity (low / medium / high / critical), a note, and the field values. Images preview inline; video and audio play in the page; every file can be downloaded.
- **Search and paging**: filter records by template and search by keyword; newest occurrence first. The list pages through records with a page-size switch (20 / 50 / 100 per page), and both the HTTP API and the agent tools accept `limit` / `offset` pagination and return the full match count.
- **Automatic storage fallback**:
  - With the database plugin (`dsh-database-config`): directories, templates, records, and the file index go to **PostgreSQL**; media files go to **MinIO**.
  - Without it: the same data goes to `$DSH_HOME/dsh-record/data.json` and media files to `$DSH_HOME/dsh-record/media/`.
  - Header badges always show the storage actually in use.
- **Agent tools (14)**: directories `list_alert_directories`, `create_alert_directory`, `update_alert_directory`, `delete_alert_directory`; templates `list_alert_templates`, `create_alert_template`, `update_alert_template`, `delete_alert_template`; records `list_alert_records`, `get_alert_record`, `create_alert_record`, `update_alert_record`, `delete_alert_record`; media `upload_alert_file`.

## Configuration

| Setting | Default | Purpose |
| --- | --- | --- |
| `localDir` | empty | Data directory when the database plugin is absent. Empty uses `$DSH_HOME/dsh-record` |
| `maxUploadMb` | `200` | Per-file upload limit in MB |

## Install

```sh
dsh plugin install /root/CODE/dsh-record
```

After enabling it, the sidebar shows an Alert records entry.

## Page

The left column is the library tree; the right column shows the selected library:

- **Records**: filter by template, search, create / edit / view / delete records.
- **Templates**: create and edit templates. The field editor adds and removes fields and picks each type and requiredness.

Header badges show `PostgreSQL` / `Local files` and `MinIO` / `Local disk`.

## Storage and API

| Mode | Metadata | Media |
| --- | --- | --- |
| Database plugin present | PostgreSQL tables `dsh_alert_nodes`, `dsh_alert_templates`, `dsh_alert_records`, `dsh_alert_files` | MinIO objects under `dsh-record/media/`, using the bucket from the database plugin |
| Database plugin absent | `data.json` | `<localDir>/media/<fileId><ext>` |

- Media files are never exposed as public URLs; the plugin's authenticated routes stream them, and HTTP Range requests let video and audio seek.
- When the database plugin is installed but PostgreSQL is down, the routes fail with `database-unavailable` and the page explains the problem; the plugin does not silently write local files, which would split the data.
- HTTP routes under `api/record`: `tree`, `nodes`, `templates`, `records`, `upload`, `file/content`, `file/download`.
- `GET api/record/records` accepts `limit` (default 100, maximum 500) and `offset`; the `total` field is the filtered match count, and the page uses both for pagination.

## Callable capabilities

### For other plugins (Cordis Service)

Every capability is registered as the Cordis service `alertRecords`; other Host plugins and the model tools call the same implementation:

```js
export const inject = ['alertRecords']

export async function apply(ctx) {
  const { nodes } = await ctx.alertRecords.tree()
  const [template] = await ctx.alertRecords.listTemplates(nodes[0].id)
  const record = await ctx.alertRecords.createRecord({
    nodeId: nodes[0].id,
    templateId: template.id,
    title: 'Furnace 3 temperature above limit',
    severity: 'high',
    values: { [template.fields[0].key]: 88.6 },
  })
  const full = await ctx.alertRecords.getRecord(record.id)
  const file = await ctx.alertRecords.uploadFile({
    fieldKey: template.fields[2].key,
    name: 'photo.png',
    contentType: 'image/png',
    bytes: pngBytes,
  })
  await ctx.alertRecords.updateRecord(record.id, {
    values: { ...full.values, [template.fields[2].key]: [file.id] },
  })
}
```

TypeScript plugins can `import type {} from 'dsh-record'` to type `ctx.alertRecords` (`index.d.ts`).

| Method | Purpose |
| --- | --- |
| `tree()` | Directory tree with template and record counts |
| `settings()` / `uploadLimit()` | Current storage mode and upload limit |
| `getDirectory(id)` / `createDirectory(input)` / `updateDirectory(input)` / `deleteDirectory(id)` | Directories |
| `getTemplate(id)` / `listTemplates(nodeId?)` / `createTemplate(input)` / `updateTemplate(input)` / `deleteTemplate(id)` | Templates |
| `getRecord(id)` / `listRecords(filter)` / `createRecord(input)` / `updateRecord(id, input)` / `deleteRecord(id)` | Records |
| `uploadFile({ fieldKey, name, contentType, bytes })` | Store an image, video, or audio file and return its id |
| `fileResponse(request, download)` | Stream a stored file, honouring HTTP Range |

### For the model (Agent tools)

The plugin registers 14 tools covering directory, template, and record CRUD plus media upload:

| Group | Tools |
| --- | --- |
| Directories | `list_alert_directories`, `create_alert_directory`, `update_alert_directory`, `delete_alert_directory` |
| Templates | `list_alert_templates`, `create_alert_template`, `update_alert_template`, `delete_alert_template` |
| Records | `list_alert_records` (accepts `limit` / `offset` pagination and returns `total`, `offset`, `hasMore`), `get_alert_record`, `create_alert_record`, `update_alert_record`, `delete_alert_record` |
| Media | `upload_alert_file` (base64 upload; returns the file id to put in a media field) |

Typical order: `list_alert_directories` → `list_alert_templates` (read the field `key`s) → `create_alert_record` (pass numbers and strings in `values`) → `upload_alert_file` for attachments → `update_alert_record` with the file id in the media field array.

## Layout

| File | Role |
| --- | --- |
| `index.js` | Host: storage selection (PostgreSQL / local JSON), MinIO / local media, Fetch routes, Agent tools |
| `index.d.ts` | `alertRecords` service types for other TypeScript plugins |
| `client.js` | Browser: sidebar entry, library tree, template and record pages, media upload and playback |
| `cordis.patch.yml` | Inserts the `dsh-record` plugin row |
| `locale/*.json` | Title and description in the plugin manager |
| `icon.svg` | Plugin icon |

## Notes

- A template field type cannot change once records use it (`field-type-in-use`), so historical values keep their meaning.
- A template that is still used by records cannot be deleted (`template-in-use`); delete those records first so historical data keeps its field definitions.
- Uploads that were never saved into a record are cleaned up after 24 hours.
