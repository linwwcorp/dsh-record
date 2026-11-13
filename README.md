# dsh-record

中文 | [English](#english)

一个 DeepSeek Harness 插件：**预警记录**。用多级目录（每个目录相当于一个库）组织预警模板和预警记录；模板字段支持数字、字符、图片、视频、音频；装了数据库插件就用 PostgreSQL + MinIO，没装就落本地文件和本地目录。

## 功能

- **多级目录**：左侧目录树可任意建子库（厂区 → 车间 → 设备），支持重命名、删除；删除目录会连带删除子目录、模板、记录和媒体文件。
- **预警模板**：每个库可以建多个模板，模板由若干字段组成：
  - `数字`：带单位（如 `℃`、`MPa`），记录时填数值；
  - `字符`：文本；
  - `图片` / `视频` / `音频`：记录时上传媒体文件。
- **预警记录**：选择模板填写标题、发生时间、等级（低 / 中 / 高 / 严重）、备注和字段值；图片可直接预览，视频和音频可在页面播放，所有媒体都能下载。
- **检索**：按模板筛选、按关键字搜索记录；记录按发生时间倒序排列。
- **存储自动降级**：
  - 检测到数据库插件（`dsh-database-config`）→ 目录、模板、记录、文件索引写入 **PostgreSQL**，媒体文件写入 **MinIO**；
  - 没有数据库插件 → 上述数据写入 `$DSH_HOME/dsh-record/data.json`，媒体文件写入 `$DSH_HOME/dsh-record/media/`。
  - 状态徽标会显示当前实际使用的存储方式。
- **Agent 工具**：`list_alert_directories`、`create_alert_directory`、`list_alert_templates`、`create_alert_template`、`list_alert_records`、`create_alert_record`、`delete_alert_record`。

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
- **模板**：新建 / 编辑模板，字段编辑器里可以增删字段、选择字段类型、填单位和是否必填。

页头徽标显示当前存储：`PostgreSQL` / `本地文件`，以及 `MinIO` / `本地目录`。

## 存储与接口

| 方式 | 元数据 | 媒体 |
| --- | --- | --- |
| 有数据库插件 | PostgreSQL 表 `dsh_alert_nodes`、`dsh_alert_templates`、`dsh_alert_records`、`dsh_alert_files` | MinIO 对象前缀 `dsh-record/media/`（bucket 用数据库插件里的配置） |
| 无数据库插件 | `data.json` | `<localDir>/media/<fileId><ext>` |

- 媒体文件不暴露公开 URL，一律由插件的认证路由读取；视频和音频支持 HTTP Range（拖动进度条）。
- 数据库插件存在但 PostgreSQL 不可用时，接口返回 `database-unavailable`，页面提示检查数据库插件，不会悄悄改成写本地文件，避免两份数据。
- HTTP 路由前缀 `api/record`：`tree`、`nodes`、`templates`、`records`、`upload`、`file/content`、`file/download`。
- 其他插件可以注入 `ctx.alertRecords` 复用同一套实现（`tree()`、`createDirectory()`、`createTemplate()`、`createRecord()` 等）。

## 结构

| 文件 | 作用 |
| --- | --- |
| `index.js` | Host：存储选择（PostgreSQL / 本地 JSON）、MinIO / 本地媒体、Fetch 路由、Agent 工具 |
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
- **Alert templates**: each library holds any number of templates made of fields:
  - `number` with an optional unit (such as `°C` or `MPa`);
  - `text`;
  - `image`, `video`, and `audio` fields that take uploaded media.
- **Alert records**: pick a template and fill in a title, occurrence time, severity (low / medium / high / critical), a note, and the field values. Images preview inline; video and audio play in the page; every file can be downloaded.
- **Search and filter**: filter records by template and search by keyword; newest occurrence first.
- **Automatic storage fallback**:
  - With the database plugin (`dsh-database-config`): directories, templates, records, and the file index go to **PostgreSQL**; media files go to **MinIO**.
  - Without it: the same data goes to `$DSH_HOME/dsh-record/data.json` and media files to `$DSH_HOME/dsh-record/media/`.
  - Header badges always show the storage actually in use.
- **Agent tools**: `list_alert_directories`, `create_alert_directory`, `list_alert_templates`, `create_alert_template`, `list_alert_records`, `create_alert_record`, `delete_alert_record`.

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
- **Templates**: create and edit templates. The field editor adds and removes fields, picks each type, and sets a unit and requiredness.

Header badges show `PostgreSQL` / `Local files` and `MinIO` / `Local disk`.

## Storage and API

| Mode | Metadata | Media |
| --- | --- | --- |
| Database plugin present | PostgreSQL tables `dsh_alert_nodes`, `dsh_alert_templates`, `dsh_alert_records`, `dsh_alert_files` | MinIO objects under `dsh-record/media/`, using the bucket from the database plugin |
| Database plugin absent | `data.json` | `<localDir>/media/<fileId><ext>` |

- Media files are never exposed as public URLs; the plugin's authenticated routes stream them, and HTTP Range requests let video and audio seek.
- When the database plugin is installed but PostgreSQL is down, the routes fail with `database-unavailable` and the page explains the problem; the plugin does not silently write local files, which would split the data.
- HTTP routes under `api/record`: `tree`, `nodes`, `templates`, `records`, `upload`, `file/content`, `file/download`.
- Other plugins can inject `ctx.alertRecords` and share the same implementation.

## Layout

| File | Role |
| --- | --- |
| `index.js` | Host: storage selection (PostgreSQL / local JSON), MinIO / local media, Fetch routes, Agent tools |
| `client.js` | Browser: sidebar entry, library tree, template and record pages, media upload and playback |
| `cordis.patch.yml` | Inserts the `dsh-record` plugin row |
| `locale/*.json` | Title and description in the plugin manager |
| `icon.svg` | Plugin icon |

## Notes

- A template field type cannot change once records use it (`field-type-in-use`), so historical values keep their meaning.
- A template that is still used by records cannot be deleted (`template-in-use`); delete those records first so historical data keeps its field definitions.
- Uploads that were never saved into a record are cleaned up after 24 hours.
