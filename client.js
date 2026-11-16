window.__ModuleLoader__.load({
  id: 'dsh-record',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useEffect, useMemo, useRef, useState } = React

    const NS = 'dsh-record'
    const PANEL_ID = 'dsh-record'
    const API = 'api/record'
    const DATABASE_BUNDLE = 'dsh-database-config'
    const MAX_FIELDS = 40
    const PAGE_SIZES = [20, 50, 100]
    const SIDEBAR_WIDTH_KEY = 'dsh-record-sidebar-width'
    const DEFAULT_SIDEBAR_WIDTH = 272
    const MIN_SIDEBAR_WIDTH = 200
    const MAX_SIDEBAR_WIDTH = 720
    const FIELD_TYPES = ['number', 'text', 'boolean', 'file']
    const SEVERITIES = ['', 'low', 'medium', 'high', 'critical']

    const COPY = {
      en: {
        panel: 'Alert records',
        'page.title': 'Alert records',
        'tree.title': 'Libraries',
        'splitter.label': 'Resize the directory column',
        'splitter.hint': 'Drag to resize, double-click to reset',
        'tree.newRoot': 'New library',
        'tree.newChild': 'New child library',
        'tree.rename': 'Rename',
        'tree.delete': 'Delete',
        'tree.expand': 'Expand',
        'tree.collapse': 'Collapse',
        'tree.empty': 'No libraries yet',
        'tree.emptyBody': 'Create the first library to organize templates and alert records.',
        'tree.emptyAction': 'New library',
        'tree.loading': 'Loading libraries…',
        'tree.failed': 'Libraries could not be loaded.',
        'tree.recordCount': '{count} records',
        'tree.selectHint': 'Select a library on the left to see its records and templates.',
        'header.templates': '{count} templates',
        'header.records': '{count} records',
        'tabs.records': 'Records',
        'tabs.templates': 'Templates',
        'action.save': 'Save',
        'action.saving': 'Saving…',
        'action.cancel': 'Cancel',
        'action.close': 'Close',
        'action.edit': 'Edit',
        'action.delete': 'Delete',
        'action.deleting': 'Deleting…',
        'action.retry': 'Retry',
        'action.refresh': 'Refresh',
        'action.refreshing': 'Refreshing…',
        'action.view': 'View',
        'action.add': 'Add',
        'action.remove': 'Remove',
        'action.newTemplate': 'New template',
        'action.newRecord': 'New record',
        'action.addField': 'Add field',
        'action.removeField': 'Remove field',
        'action.openDatabase': 'Open database plugin',
        'field.type.number': 'Number',
        'field.type.text': 'Text',
        'field.type.boolean': 'Boolean',
        'field.type.file': 'File',
        'value.yes': 'Yes',
        'value.no': 'No',
        'templates.loading': 'Loading templates…',
        'templates.emptyTitle': 'No templates in this library',
        'templates.emptyBody': 'Create a template to describe the fields every alert record needs.',
        'templates.emptyAction': 'New template',
        'templates.recordCount': '{count} records',
        'templates.fieldsCount': '{count} fields',
        'templates.deleteTitle': 'Delete template?',
        'templates.deleteBody': 'Deleting “{name}” removes the template. A template that still has records cannot be deleted; delete those records first.',
        'template.dialog.createTitle': 'New template',
        'template.dialog.editTitle': 'Edit template',
        'template.dialog.name': 'Template name',
        'template.dialog.description': 'Description',
        'template.dialog.fields': 'Fields',
        'template.dialog.fieldLabel': 'Field label',
        'template.dialog.fieldType': 'Type',
        'template.dialog.required': 'Required',
        'template.dialog.emptyField': 'Add at least one field.',
        'template.dialog.nameRequired': 'Enter a template name.',
        'template.dialog.fieldRequired': 'Every field needs a label.',
        'template.dialog.fieldLimit': 'A template can have at most {count} fields.',
        'template.dialog.saveFailed': 'The template could not be saved.',
        'template.dialog.fieldTypeInUse': 'A field type cannot change while records use this template. Create a new template instead.',
        'records.new': 'New record',
        'records.search': 'Search',
        'records.searchPlaceholder': 'Search title, note, or values',
        'records.templateFilter': 'Template',
        'records.allTemplates': 'All templates',
        'pager.label': 'Record pages',
        'pager.prev': 'Previous',
        'pager.next': 'Next',
        'pager.page': 'Page {page} of {pages}',
        'pager.total': '{total} records',
        'pager.pageSize': 'Per page',
        'pager.sizeOption': '{count}',
        'records.emptyTitle': 'No records in this library',
        'records.emptyBody': 'Add the first alert record, or adjust the filters.',
        'records.emptyFilteredTitle': 'No matching records',
        'records.emptyFilteredBody': 'Try another search or template filter.',
        'records.loading': 'Loading records…',
        'records.count': '{shown} of {total}',
        'records.files': '{count} files',
        'records.columnTitle': 'Title',
        'records.columnSeverity': 'Severity',
        'records.columnTemplate': 'Template',
        'records.columnOccurred': 'Occurred',
        'records.columnValues': 'Values',
        'records.columnActions': 'Actions',
        'records.selected': '{count} selected',
        'records.clearSelection': 'Clear selection',
        'records.batchDelete': 'Delete selected',
        'records.batchDeleteTitle': 'Delete selected records?',
        'records.batchDeleteBody': 'Deletes {count} selected records and their attachments. This cannot be undone.',
        'records.selectAll': 'Select every record on this page',
        'records.selectRow': 'Select “{title}”',
        'records.batchFailed': '{count} of {total} records could not be deleted: {message}',
        'record.dialog.createTitle': 'New record',
        'record.dialog.editTitle': 'Edit record',
        'record.dialog.template': 'Template',
        'record.dialog.templatePlaceholder': 'Select a template',
        'record.dialog.title': 'Title',
        'record.dialog.titlePlaceholder': 'Furnace 3 temperature above limit',
        'record.dialog.occurredAt': 'Occurred at',
        'record.dialog.severity': 'Severity',
        'record.dialog.note': 'Note',
        'record.dialog.notePlaceholder': 'Optional context for this record',
        'record.dialog.values': 'Values',
        'record.dialog.upload': 'Add file',
        'record.dialog.removeFile': 'Remove file',
        'record.dialog.uploading': 'Uploading…',
        'record.dialog.noTemplate': 'Create a template in this library before adding records.',
        'record.dialog.templateRequired': 'Select a template.',
        'record.dialog.titleRequired': 'Enter a title.',
        'record.dialog.numberInvalid': '“{label}” must be a number.',
        'record.dialog.requiredField': '“{label}” is required.',
        'record.dialog.saveFailed': 'The record could not be saved.',
        'record.dialog.uploadFailed': 'The file could not be uploaded.',
        'record.detail.title': 'Record details',
        'record.detail.note': 'Note',
        'record.detail.createdAt': 'Created',
        'record.detail.updatedAt': 'Updated',
        'record.detail.download': 'Download',
        'record.detail.noValues': 'This record has no field values.',
        'record.detail.emptyValue': 'Not set',
        'record.detail.files': 'Attachments',
        'severity.none': 'Unrated',
        'severity.low': 'Low',
        'severity.medium': 'Medium',
        'severity.high': 'High',
        'severity.critical': 'Critical',
        'node.createTitle': 'New library',
        'node.childTitle': 'New child library',
        'node.editTitle': 'Rename library',
        'node.name': 'Name',
        'node.namePlaceholder': 'Plant A',
        'node.description': 'Description',
        'node.descriptionPlaceholder': 'Optional notes about this library',
        'node.nameRequired': 'Enter a name.',
        'node.saveFailed': 'The library could not be saved.',
        'node.deleteTitle': 'Delete library?',
        'node.deleteBody': 'Deleting “{name}” also removes its child libraries, templates, records, and files. This cannot be undone.',
        'record.deleteTitle': 'Delete record?',
        'record.deleteBody': 'Deleting “{name}” also removes its attachments. This cannot be undone.',
        'delete.confirm': 'Delete',
        'delete.failed': 'The item could not be deleted.',
        'error.request': 'The request failed. Check the connection and try again.',
        'error.generic': 'The request failed. Please try again.',
        'state.loading': 'Loading alert records…',
        'state.errorTitle': 'Alert records unavailable',
        'state.databaseMissingTitle': 'PostgreSQL is not configured',
        'state.databaseMissingBody': 'This page uses PostgreSQL through the Database connections plugin. Configure its connection, then retry.',
        'state.databaseDownTitle': 'PostgreSQL is unavailable',
        'state.databaseDownBody': 'The Database connections plugin is installed, but PostgreSQL is unreachable.'
          + ' Check that connection, then retry. While the plugin is enabled, records are not read from local files.',
      },
      zh: {
        panel: '预警记录',
        'page.title': '预警记录',
        'tree.title': '预警库',
        'splitter.label': '调整目录栏宽度',
        'splitter.hint': '拖动调整宽度，双击恢复默认',
        'tree.newRoot': '新建根库',
        'tree.newChild': '新建子库',
        'tree.rename': '重命名',
        'tree.delete': '删除',
        'tree.expand': '展开',
        'tree.collapse': '收起',
        'tree.empty': '还没有预警库',
        'tree.emptyBody': '新建第一个预警库，用来组织模板和预警记录。',
        'tree.emptyAction': '新建预警库',
        'tree.loading': '正在读取预警库…',
        'tree.failed': '预警库读取失败。',
        'tree.recordCount': '{count} 条记录',
        'tree.selectHint': '在左侧选择一个预警库，查看它的记录和模板。',
        'header.templates': '{count} 个模板',
        'header.records': '{count} 条记录',
        'tabs.records': '记录',
        'tabs.templates': '模板',
        'action.save': '保存',
        'action.saving': '正在保存…',
        'action.cancel': '取消',
        'action.close': '关闭',
        'action.edit': '编辑',
        'action.delete': '删除',
        'action.deleting': '正在删除…',
        'action.retry': '重试',
        'action.refresh': '刷新',
        'action.refreshing': '正在刷新…',
        'action.view': '查看',
        'action.add': '新增',
        'action.remove': '移除',
        'action.newTemplate': '新建模板',
        'action.newRecord': '新建记录',
        'action.addField': '添加字段',
        'action.removeField': '移除字段',
        'action.openDatabase': '打开数据库插件',
        'field.type.number': '数字',
        'field.type.text': '文本',
        'field.type.boolean': '布尔',
        'field.type.file': '文件',
        'value.yes': '是',
        'value.no': '否',
        'templates.loading': '正在读取模板…',
        'templates.emptyTitle': '这个库还没有模板',
        'templates.emptyBody': '先创建模板，定义每条预警记录需要填写的字段。',
        'templates.emptyAction': '新建模板',
        'templates.recordCount': '{count} 条记录',
        'templates.fieldsCount': '{count} 个字段',
        'templates.deleteTitle': '删除模板？',
        'templates.deleteBody': '删除“{name}”会移除模板。仍被记录使用的模板不能删除，请先删除这些记录。',
        'template.dialog.createTitle': '新建模板',
        'template.dialog.editTitle': '编辑模板',
        'template.dialog.name': '模板名称',
        'template.dialog.description': '说明',
        'template.dialog.fields': '字段',
        'template.dialog.fieldLabel': '字段名称',
        'template.dialog.fieldType': '类型',
        'template.dialog.required': '必填',
        'template.dialog.emptyField': '至少添加一个字段。',
        'template.dialog.nameRequired': '请填写模板名称。',
        'template.dialog.fieldRequired': '每个字段都需要填写名称。',
        'template.dialog.fieldLimit': '一个模板最多 {count} 个字段。',
        'template.dialog.saveFailed': '模板保存失败。',
        'template.dialog.fieldTypeInUse': '已有记录使用该模板，无法修改字段类型。请改为新建模板。',
        'records.new': '新建记录',
        'records.search': '搜索',
        'records.searchPlaceholder': '搜索标题、备注或字段值',
        'records.templateFilter': '模板',
        'records.allTemplates': '全部模板',
        'pager.label': '记录分页',
        'pager.prev': '上一页',
        'pager.next': '下一页',
        'pager.page': '第 {page} / {pages} 页',
        'pager.total': '共 {total} 条',
        'pager.pageSize': '每页',
        'pager.sizeOption': '{count} 条',
        'records.emptyTitle': '这个库还没有记录',
        'records.emptyBody': '新增第一条预警记录，或调整筛选条件。',
        'records.emptyFilteredTitle': '没有匹配的记录',
        'records.emptyFilteredBody': '换一个搜索词或模板试试。',
        'records.loading': '正在读取记录…',
        'records.count': '{shown} / {total} 条',
        'records.files': '{count} 个文件',
        'records.columnTitle': '标题',
        'records.columnSeverity': '级别',
        'records.columnTemplate': '模板',
        'records.columnOccurred': '发生时间',
        'records.columnValues': '字段摘要',
        'records.columnActions': '操作',
        'records.selected': '已选 {count} 条',
        'records.clearSelection': '取消选择',
        'records.batchDelete': '批量删除',
        'records.batchDeleteTitle': '批量删除记录？',
        'records.batchDeleteBody': '将删除选中的 {count} 条记录及其附件，此操作无法撤销。',
        'records.selectAll': '全选本页记录',
        'records.selectRow': '选择“{title}”',
        'records.batchFailed': '{count} / {total} 条记录删除失败：{message}',
        'record.dialog.createTitle': '新建记录',
        'record.dialog.editTitle': '编辑记录',
        'record.dialog.template': '模板',
        'record.dialog.templatePlaceholder': '选择模板',
        'record.dialog.title': '标题',
        'record.dialog.titlePlaceholder': '3号炉温度超限',
        'record.dialog.occurredAt': '发生时间',
        'record.dialog.severity': '级别',
        'record.dialog.note': '备注',
        'record.dialog.notePlaceholder': '可选：补充说明',
        'record.dialog.values': '字段值',
        'record.dialog.upload': '选择文件',
        'record.dialog.removeFile': '移除文件',
        'record.dialog.uploading': '正在上传…',
        'record.dialog.noTemplate': '请先在这个库里创建模板，再新增记录。',
        'record.dialog.templateRequired': '请选择模板。',
        'record.dialog.titleRequired': '请填写标题。',
        'record.dialog.numberInvalid': '“{label}”必须是数字。',
        'record.dialog.requiredField': '“{label}”不能为空。',
        'record.dialog.saveFailed': '记录保存失败。',
        'record.dialog.uploadFailed': '文件上传失败。',
        'record.detail.title': '记录详情',
        'record.detail.note': '备注',
        'record.detail.createdAt': '创建时间',
        'record.detail.updatedAt': '更新时间',
        'record.detail.download': '下载',
        'record.detail.noValues': '这条记录没有字段值。',
        'record.detail.emptyValue': '未填写',
        'record.detail.files': '附件',
        'severity.none': '未分级',
        'severity.low': '低',
        'severity.medium': '中',
        'severity.high': '高',
        'severity.critical': '紧急',
        'node.createTitle': '新建预警库',
        'node.childTitle': '新建子库',
        'node.editTitle': '重命名预警库',
        'node.name': '名称',
        'node.namePlaceholder': '厂区A',
        'node.description': '说明',
        'node.descriptionPlaceholder': '可选：这个库的用途',
        'node.nameRequired': '请填写名称。',
        'node.saveFailed': '预警库保存失败。',
        'node.deleteTitle': '删除预警库？',
        'node.deleteBody': '删除“{name}”会同时删除它的子库、模板、记录和文件。此操作无法撤销。',
        'record.deleteTitle': '删除记录？',
        'record.deleteBody': '删除“{name}”会同时删除它的附件。此操作无法撤销。',
        'delete.confirm': '删除',
        'delete.failed': '删除失败。',
        'error.request': '请求失败，请检查连接后重试。',
        'error.generic': '请求失败，请重试。',
        'state.loading': '正在读取预警记录…',
        'state.errorTitle': '预警记录暂时不可用',
        'state.databaseMissingTitle': 'PostgreSQL 尚未配置',
        'state.databaseMissingBody': '本页通过 Database connections（数据库连接）插件读写 PostgreSQL。请在该插件中完成配置后重试。',
        'state.databaseDownTitle': 'PostgreSQL 暂时不可用',
        'state.databaseDownBody': '已安装 Database connections（数据库连接）插件，但当前无法连接 PostgreSQL。请在该插件中检查连接后重试。启用数据库插件时，数据不会回退到本地文件。',
      },
    }

    const CSS = `
.dsh-record-page {
  --dsh-record-accent: #5b93f5;
  --dsh-record-accent-hover: #4a84ee;
  --dsh-record-accent-soft: rgba(91, 147, 245, .22);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  line-height: 1.55;
}
.dsh-record-body { display: flex; flex: 1; min-width: 0; min-height: 0; }
.dsh-record-sidebar {
  display: flex; flex-direction: column; flex: none; min-width: 0; min-height: 0;
  max-width: 60%;
  border-right: 0.5px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-base);
}
.dsh-record-splitter {
  position: relative; z-index: 2; flex: none; width: 7px; margin: 0 -3.5px;
  cursor: col-resize; touch-action: none; background: transparent;
}
.dsh-record-splitter-grip {
  position: absolute; top: 10px; bottom: 10px; left: 2px; width: 3px;
  border-radius: 2px; background: transparent; transition: background .15s ease;
}
.dsh-record-splitter:hover .dsh-record-splitter-grip,
.dsh-record-splitter:focus-visible .dsh-record-splitter-grip,
.dsh-record-body[data-resizing='true'] .dsh-record-splitter-grip {
  background: var(--dsh-record-accent);
}
.dsh-record-splitter:focus-visible { outline: none; }
.dsh-record-body[data-resizing='true'] { cursor: col-resize; user-select: none; }
.dsh-record-body[data-resizing='true'] * { user-select: none; }
.dsh-record-sidebar-head {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 14px 14px 8px;
}
[data-platform='darwin'] .dsh-record-sidebar-head { padding-top: calc(14px + var(--dsh-frame-top-clearance, 0px)); }
.dsh-record-sidebar-title { color: var(--dsw-alias-label-secondary); font-size: 12px; font-weight: 600; }
.dsh-record-sidebar-tools { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; padding: 0 12px 8px; }
.dsh-record-tree { flex: 1; min-height: 0; overflow: auto; padding: 2px 8px 18px; scrollbar-gutter: stable; }
.dsh-record-tree-row {
  display: flex; align-items: center; gap: 5px; box-sizing: border-box;
  height: 32px; padding: 0 6px; border-radius: 7px;
  color: var(--dsw-alias-label-primary); cursor: pointer; user-select: none;
}
.dsh-record-tree-row:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dsh-record-tree-row-selected,
.dsh-record-tree-row-selected:hover { background: var(--dsw-alias-bg-multi-select); }
.dsh-record-tree-row:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -2px; }
.dsh-record-tree-chevron {
  display: inline-flex; align-items: center; justify-content: center;
  width: 16px; height: 16px; flex: none; padding: 0;
  border: none; border-radius: 4px; background: transparent;
  color: var(--dsw-alias-label-secondary); cursor: pointer;
}
.dsh-record-tree-chevron:hover { color: var(--dsw-alias-label-primary); }
.dsh-record-tree-chevron svg { transition: transform .12s ease; }
.dsh-record-chevron-closed { transform: rotate(-90deg); }
.dsh-record-tree-icon { display: inline-flex; flex: none; color: var(--dsw-alias-label-secondary); }
.dsh-record-tree-label {
  flex: 1; min-width: 0; overflow: hidden;
  font-size: 13px; text-overflow: ellipsis; white-space: nowrap;
}
.dsh-record-tree-count { flex: none; color: var(--dsw-alias-label-tertiary); font-size: 11px; }
.dsh-record-tree-actions { display: none; align-items: center; gap: 2px; flex: none; }
.dsh-record-tree-row:hover .dsh-record-tree-actions,
.dsh-record-tree-row:focus-within .dsh-record-tree-actions { display: inline-flex; }
.dsh-record-tree-action {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; padding: 0; flex: none;
  border: none; border-radius: 5px; background: transparent;
  color: var(--dsw-alias-label-secondary); cursor: pointer;
}
.dsh-record-tree-action:hover { background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); }
.dsh-record-tree-action-danger:hover { color: var(--dsw-alias-state-error-primary); }
.dsh-record-tree-empty { padding: 22px 16px; color: var(--dsw-alias-label-secondary); font-size: 12px; text-align: center; }
.dsh-record-tree-error { display: grid; gap: 8px; padding: 18px 14px; color: var(--dsw-alias-state-error-primary); font-size: 12px; }
.dsh-record-main { display: flex; flex: 1; flex-direction: column; min-width: 0; min-height: 0; }
.dsh-record-main-head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  flex: none; box-sizing: border-box; padding: 18px 22px 10px;
}
[data-platform='darwin'] .dsh-record-main-head { padding-top: calc(18px + var(--dsh-frame-top-clearance, 0px)); }
.dsh-record-heading { display: grid; gap: 4px; min-width: 0; }
.dsh-record-title {
  margin: 0; overflow: hidden; font-size: 18px; line-height: 26px; font-weight: 600;
  text-overflow: ellipsis; white-space: nowrap;
}
.dsh-record-subtitle {
  margin: 0; max-width: 720px; color: var(--dsw-alias-label-secondary);
  font-size: 12px; line-height: 18px; overflow-wrap: anywhere;
}
.dsh-record-badges { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-top: 2px; }
.dsh-record-badge {
  display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 8px;
  border: 0.5px solid var(--dsw-alias-border-l1); border-radius: 11px;
  color: var(--dsw-alias-label-secondary); font-size: 11px; white-space: nowrap;
}
.dsh-record-badge strong { color: var(--dsw-alias-label-primary); font-weight: 500; }
.dsh-record-muted { color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 18px; }
.dsh-record-tabs {
  display: flex; align-items: center; gap: 2px; flex: none;
  overflow-x: auto; padding: 0 22px; border-bottom: 0.5px solid var(--dsw-alias-border-l1);
}
.dsh-record-tab {
  height: 34px; padding: 0 12px; flex: none;
  border: none; border-bottom: 2px solid transparent; border-radius: 0;
  background: transparent; color: var(--dsw-alias-label-secondary);
  font: inherit; font-size: 13px; font-weight: 500; cursor: pointer;
}
.dsh-record-tab:hover { color: var(--dsw-alias-label-primary); }
.dsh-record-tab-active { border-bottom-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-primary); }
.dsh-record-content { flex: 1; min-height: 0; overflow: auto; padding: 14px 22px 40px; }
.dsh-record-content-fill {
  display: flex; flex-direction: column; overflow: hidden; padding-bottom: 0;
}
.dsh-record-content-fill > .dsh-record-banner { flex: none; }
.dsh-record-toolbar { display: flex; align-items: flex-end; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.dsh-record-inline-field { display: grid; gap: 4px; min-width: 0; }
.dsh-record-inline-field > span { color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 16px; }
.dsh-record-search { flex: 1 1 220px; max-width: 340px; }
.dsh-record-input,
.dsh-record-select,
.dsh-record-textarea {
  box-sizing: border-box; width: 100%; min-width: 0;
  padding: 6px 9px; border: 0.5px solid var(--dsw-alias-border-l2); border-radius: 7px;
  outline: none; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary);
  font: inherit; font-size: 13px;
}
.dsh-record-input,
.dsh-record-select { height: 32px; }
.dsh-record-textarea { min-height: 80px; resize: vertical; }
.dsh-record-input:focus,
.dsh-record-select:focus,
.dsh-record-textarea:focus {
  border-color: var(--dsh-record-accent);
  box-shadow: 0 0 0 2px var(--dsh-record-accent-soft);
}

.dsh-record-select-wrap { position: relative; min-width: 0; }
.dsh-record-select-control {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  box-sizing: border-box; width: 100%; min-width: 0; height: 32px;
  padding: 0 10px; border: 0.5px solid var(--dsw-alias-border-l2); border-radius: 10px;
  outline: none; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary);
  font: inherit; font-size: 13px; text-align: left; cursor: pointer;
}
.dsh-record-select-control:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
.dsh-record-select-control:focus-visible {
  border-color: var(--dsh-record-accent);
  box-shadow: 0 0 0 2px var(--dsh-record-accent-soft);
}
.dsh-record-select-control:disabled { opacity: .55; cursor: default; }
.dsh-record-select-control svg { flex: none; color: var(--dsw-alias-label-secondary); }
.dsh-record-select-value { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dsh-record-select-menu {
  box-sizing: border-box; margin: 0; padding: 5px; list-style: none; overflow: auto;
  border: 0.5px solid var(--dsw-alias-border-l1); border-radius: 14px;
  background: var(--dsw-alias-bg-overlay);
  box-shadow: 0 14px 34px color-mix(in srgb, var(--dsw-alias-label-primary) 18%, transparent);
}
.dsh-record-select-option {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  box-sizing: border-box; width: 100%; min-height: 30px; padding: 5px 9px;
  border: 0; border-radius: 10px; background: transparent; color: var(--dsw-alias-label-primary);
  font: inherit; font-size: 13px; text-align: left; cursor: pointer;
}
.dsh-record-select-option[data-active='true'] { background: var(--dsw-alias-interactive-bg-hover); }
.dsh-record-select-option[aria-selected='true'] {
  background: color-mix(in srgb, var(--dsh-record-accent) 14%, transparent);
  color: var(--dsh-record-accent-hover); font-weight: 600;
}
.dsh-record-select-option svg { flex: none; }
.dsh-record-button {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 32px; padding: 0 12px; flex: none;
  border: 0.5px solid var(--dsw-alias-border-l2); border-radius: 8px;
  background: transparent; color: var(--dsw-alias-label-primary);
  font: inherit; font-size: 12px; font-weight: 500; cursor: pointer;
}
.dsh-record-button:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
.dsh-record-button:disabled { cursor: default; opacity: .55; }
.dsh-record-button-primary {
  border-color: var(--dsh-record-accent);
  background: var(--dsh-record-accent);
  color: #fff;
}
.dsh-record-button-primary:hover:not(:disabled) {
  background: var(--dsh-record-accent-hover);
  border-color: var(--dsh-record-accent-hover);
  color: #fff;
}
.dsh-record-button-danger {
  border-color: var(--dsw-alias-state-error-primary);
  background: var(--dsw-alias-state-error-primary);
  color: #fff;
}
.dsh-record-icon-button {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; padding: 0; flex: none;
  border: 0.5px solid transparent; border-radius: 6px;
  background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer;
}
.dsh-record-icon-button:hover:not(:disabled) {
  border-color: var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
}
.dsh-record-icon-button:disabled { cursor: default; opacity: .55; }
.dsh-record-small-button {
  height: 26px; padding: 0 8px; flex: none;
  border: 0.5px solid transparent; border-radius: 6px;
  background: transparent; color: var(--dsw-alias-label-secondary);
  font: inherit; font-size: 11px; cursor: pointer;
}
.dsh-record-small-button:hover { border-color: var(--dsw-alias-border-l1); color: var(--dsw-alias-label-primary); }
.dsh-record-small-button-danger:hover { color: var(--dsw-alias-state-error-primary); }
.dsh-record-panel {
  border: 0.5px solid var(--dsw-alias-border-l1); border-radius: 14px;
  background: var(--dsw-alias-bg-layer-1); overflow: hidden;
}
.dsh-record-records { display: flex; flex: 1; flex-direction: column; min-height: 0; }
.dsh-record-records > .dsh-record-toolbar { flex: none; }
.dsh-record-records-scroll { flex: 1; min-height: 0; overflow: auto; padding-bottom: 12px; }
.dsh-record-pager {
  display: flex; align-items: center; justify-content: space-between; gap: 10px; flex: none; flex-wrap: wrap;
  margin-top: 0; padding: 10px 2px 14px;
  border-top: 0.5px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px;
}
.dsh-record-pager-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.dsh-record-pager-info { font-variant-numeric: tabular-nums; }
.dsh-record-pager-size { display: flex; align-items: center; gap: 6px; }
.dsh-record-pager-size .dsh-record-select-wrap { width: 96px; }
.dsh-record-table-wrap { overflow-x: auto; }
.dsh-record-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.dsh-record-table th {
  padding: 9px 12px; border-bottom: 0.5px solid var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-secondary); font-size: 11px; font-weight: 500;
  letter-spacing: .02em; text-align: left; white-space: nowrap;
}
.dsh-record-table td {
  padding: 10px 12px; border-bottom: 0.5px solid var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-primary); font-size: 13px; line-height: 19px; vertical-align: top;
}
.dsh-record-table tbody tr:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dsh-record-table tbody tr:last-child td { border-bottom: 0; }
.dsh-record-col-title { width: 25%; }
.dsh-record-col-severity { width: 10%; }
.dsh-record-col-template { width: 15%; }
.dsh-record-col-occurred { width: 18%; }
.dsh-record-col-values { width: 24%; }
.dsh-record-col-actions { width: 8%; }
.dsh-record-col-select { width: 36px; }
.dsh-record-checkbox-cell { width: 36px; text-align: center; }
.dsh-record-checkbox-cell input { margin: 0; cursor: pointer; }
.dsh-record-row-selected { background: color-mix(in srgb, var(--dsh-record-accent) 8%, transparent); }
.dsh-record-selection-bar {
  display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
  margin-bottom: 8px; padding: 8px 12px; border: 0.5px solid var(--dsh-record-accent); border-radius: 10px;
  background: color-mix(in srgb, var(--dsh-record-accent) 10%, transparent);
  color: var(--dsw-alias-label-primary); font-size: 12px; line-height: 18px;
}
.dsh-record-selection-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.dsh-record-row-title { font-weight: 500; overflow-wrap: anywhere; }
.dsh-record-row-template {
  display: block; overflow: hidden; color: var(--dsw-alias-label-secondary);
  font-size: 12px; text-overflow: ellipsis; white-space: nowrap;
}
.dsh-record-summary { display: flex; flex-wrap: wrap; gap: 4px; }
.dsh-record-chip {
  display: inline-flex; align-items: center; gap: 4px; max-width: 100%;
  padding: 1px 7px; border: 0.5px solid var(--dsw-alias-border-l1); border-radius: 10px;
  color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 17px;
}
.dsh-record-chip-label { color: var(--dsw-alias-label-primary); font-weight: 500; }
.dsh-record-chip-type { color: var(--dsw-alias-label-tertiary); }
.dsh-record-chip-required { color: var(--dsw-alias-state-error-primary); }
.dsh-record-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.dsh-record-card-grid { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
.dsh-record-card {
  display: grid; gap: 8px; box-sizing: border-box; padding: 12px 14px;
  border: 0.5px solid var(--dsw-alias-border-l1); border-radius: 12px;
  background: var(--dsw-alias-bg-layer-1);
}
.dsh-record-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.dsh-record-card-title { display: grid; gap: 2px; min-width: 0; }
.dsh-record-card-title h2 {
  margin: 0; overflow: hidden; font-size: 14px; line-height: 20px; font-weight: 600;
  text-overflow: ellipsis; white-space: nowrap;
}
.dsh-record-card-actions { display: flex; align-items: center; gap: 2px; flex: none; }
.dsh-record-card-desc {
  margin: 0; display: -webkit-box; overflow: hidden; color: var(--dsw-alias-label-secondary);
  font-size: 12px; line-height: 18px; -webkit-box-orient: vertical; -webkit-line-clamp: 2;
}
.dsh-record-empty {
  display: grid; justify-items: center; gap: 8px;
  padding: 48px 24px; border: 0.5px solid var(--dsw-alias-border-l1);
  border-radius: 14px; background: var(--dsw-alias-bg-layer-1); text-align: center;
}
.dsh-record-empty h2 { margin: 0; font-size: 14px; line-height: 20px; font-weight: 600; }
.dsh-record-empty p {
  max-width: 440px; margin: 0 0 4px; color: var(--dsw-alias-label-secondary);
  font-size: 13px; line-height: 20px;
}
.dsh-record-state-wrap { display: grid; place-items: center; flex: 1; min-height: 0; overflow: auto; padding: 32px 24px; }
.dsh-record-state { display: grid; justify-items: center; gap: 10px; max-width: 620px; text-align: center; }
.dsh-record-state h2 { margin: 0; font-size: 16px; line-height: 24px; font-weight: 600; }
.dsh-record-state p { margin: 0; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 21px; }
.dsh-record-state-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 4px; }
.dsh-record-banner {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  margin-bottom: 12px; padding: 9px 12px;
  border: 0.5px solid var(--dsw-alias-border-l1); border-radius: 10px;
  background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-state-error-primary);
  font-size: 12px; line-height: 18px;
}
.dsh-record-banner p { margin: 0; overflow-wrap: anywhere; }
.dsh-record-skeleton { display: grid; gap: 10px; padding: 10px 2px; }
.dsh-record-skeleton-row {
  height: 18px; border-radius: 6px; background: var(--dsw-alias-bg-skeleton);
  animation: dsh-record-pulse 1.2s ease-in-out infinite;
}
.dsh-record-skeleton-row:nth-child(2n) { width: 76%; }
.dsh-record-skeleton-row:nth-child(3n) { width: 88%; }
@keyframes dsh-record-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .55; } }
.dsh-record-overlay {
  position: fixed; inset: 0; z-index: 1000;
  display: grid; place-items: center; padding: 24px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 30%, transparent);
}
.dsh-record-dialog {
  box-sizing: border-box; display: flex; flex-direction: column;
  width: min(560px, 100%); max-height: min(760px, calc(100vh - 48px));
  border: 0.5px solid var(--dsw-alias-border-l1); border-radius: 16px;
  background: var(--dsw-alias-bg-overlay);
  box-shadow: 0 18px 60px color-mix(in srgb, var(--dsw-alias-label-primary) 22%, transparent);
  color: var(--dsw-alias-label-primary);
}
.dsh-record-dialog-wide { width: min(780px, 100%); }
.dsh-record-dialog-head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  padding: 16px 18px 10px;
}
.dsh-record-dialog-head h2 { margin: 0; font-size: 16px; line-height: 24px; font-weight: 600; }
.dsh-record-dialog-body { display: grid; gap: 12px; padding: 2px 18px 14px; overflow: auto; }
.dsh-record-dialog-foot {
  display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 8px;
  padding: 12px 18px 16px; border-top: 0.5px solid var(--dsw-alias-border-l1);
}
.dsh-record-field { display: grid; gap: 4px; min-width: 0; }
.dsh-record-field-label { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 16px; }
.dsh-record-field-hint { color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 16px; }
.dsh-record-form-error { margin: 0; color: var(--dsw-alias-state-error-primary); font-size: 12px; line-height: 18px; }
.dsh-record-severity {
  display: inline-flex; align-items: center; height: 20px; padding: 0 7px;
  border: 0.5px solid var(--dsw-alias-border-l1); border-radius: 10px;
  color: var(--dsw-alias-label-secondary); font-size: 11px; white-space: nowrap;
}
.dsh-record-severity-low { border-color: var(--dsw-alias-state-success-primary); color: var(--dsw-alias-state-success-primary); }
.dsh-record-severity-medium { border-color: var(--dsw-alias-state-warn-primary); color: var(--dsw-alias-state-warn-label); }
.dsh-record-severity-high { border-color: var(--dsw-alias-state-error-primary); color: var(--dsw-alias-state-error-primary); }
.dsh-record-severity-critical {
  border-color: var(--dsw-alias-state-error-primary);
  background: var(--dsw-alias-state-error-primary);
  color: var(--dsw-alias-label-primary-foreground);
}
.dsh-record-field-row {
  display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) auto auto;
  align-items: end; gap: 8px;
  padding: 9px; border: 0.5px solid var(--dsw-alias-border-l1); border-radius: 10px;
  background: var(--dsw-alias-bg-base);
}
.dsh-record-form-row {
  display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1.2fr);
  align-items: start; gap: 8px;
}
.dsh-record-checkbox { display: flex; align-items: center; gap: 5px; height: 32px; font-size: 12px; }
.dsh-record-checkbox input { width: 14px; height: 14px; margin: 0; accent-color: var(--dsw-alias-brand-primary); }
.dsh-record-dynamic { display: grid; gap: 10px; }
.dsh-record-dynamic-item {
  display: grid; gap: 6px; padding: 10px; border: 0.5px solid var(--dsw-alias-border-l1);
  border-radius: 10px; background: var(--dsw-alias-bg-base);
}
.dsh-record-uploads { display: flex; flex-wrap: wrap; gap: 6px; }
.dsh-record-upload-item { position: relative; display: flex; align-items: center; gap: 6px; }
.dsh-record-thumb {
  width: 56px; height: 56px; border-radius: 8px; object-fit: cover;
  border: 0.5px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2);
}
.dsh-record-upload-remove {
  position: absolute; top: -6px; right: -6px;
  width: 20px; height: 20px;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: 50%; background: var(--dsw-alias-bg-base);
}
.dsh-record-file-chip {
  display: inline-flex; align-items: center; gap: 5px; max-width: 220px;
  padding: 4px 8px; border: 0.5px solid var(--dsw-alias-border-l1); border-radius: 8px;
  color: var(--dsw-alias-label-secondary); font-size: 11px;
}
.dsh-record-file-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dsh-record-file-open { color: var(--dsw-alias-link); text-decoration: none; }
.dsh-record-file-open:hover { text-decoration: underline; }
.dsh-record-file-input { max-width: 100%; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; }
.dsh-record-section-title { margin: 2px 0 0; color: var(--dsw-alias-label-secondary); font-size: 12px; font-weight: 600; }
.dsh-record-detail-head { display: grid; gap: 4px; }
.dsh-record-detail-title { margin: 0; font-size: 15px; line-height: 22px; font-weight: 600; overflow-wrap: anywhere; }
.dsh-record-detail-list { display: grid; gap: 10px; }
.dsh-record-detail-item {
  display: grid; gap: 4px; padding: 9px 0;
  border-bottom: 0.5px solid var(--dsw-alias-border-l1);
}
.dsh-record-detail-item:last-child { border-bottom: 0; }
.dsh-record-detail-label { color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 16px; }
.dsh-record-detail-value { margin: 0; font-size: 13px; line-height: 20px; overflow-wrap: anywhere; }
.dsh-record-media-list { display: grid; gap: 8px; }
.dsh-record-media { display: grid; gap: 5px; }
.dsh-record-media-info { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 11px; }
.dsh-record-detail-image {
  display: block; max-width: 100%; max-height: 260px; border-radius: 8px;
  border: 0.5px solid var(--dsw-alias-border-l1); object-fit: contain;
}
.dsh-record-detail-video { display: block; max-width: 100%; max-height: 300px; border-radius: 8px; background: #000; }
.dsh-record-detail-audio { display: block; width: 100%; max-width: 420px; }
.dsh-record-link {
  color: var(--dsw-alias-link); font-size: 11px; text-decoration: none;
}
.dsh-record-link:hover { text-decoration: underline; }
.dsh-record-settings { display: grid; gap: 10px; padding: 2px 2px 8px; }
.dsh-record-settings h2 { margin: 0; font-size: 15px; line-height: 22px; font-weight: 600; }
.dsh-record-settings p { margin: 0; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 19px; }
.dsh-record-settings-modes { display: grid; gap: 6px; }
.dsh-record-settings-mode {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 8px 10px; border: 0.5px solid var(--dsw-alias-border-l1); border-radius: 9px;
  font-size: 12px;
}
.dsh-record-settings-mode span:first-child { color: var(--dsw-alias-label-secondary); }
.dsh-record-settings-note { color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 17px; }
.dsh-record-page :focus-visible { outline: 2px solid var(--dsh-record-accent); outline-offset: 1px; }
.dsh-record-page input[type='checkbox'] { accent-color: var(--dsh-record-accent); }
@media (max-width: 860px) {
  .dsh-record-body { flex-direction: column; overflow: auto; }
  .dsh-record-sidebar {
    width: 100% !important; max-width: none; max-height: 38vh;
    border-right: none; border-bottom: 0.5px solid var(--dsw-alias-border-l1);
  }
  .dsh-record-splitter { display: none; }
  .dsh-record-main { min-height: 0; overflow: visible; }
  .dsh-record-content { overflow: visible; padding-left: 16px; padding-right: 16px; }
  .dsh-record-content-fill { display: block; overflow: visible; padding-bottom: 40px; }
  .dsh-record-records { display: block; }
  .dsh-record-records-scroll { overflow: visible; padding-bottom: 0; }
  .dsh-record-pager { padding: 14px 2px 0; border-top: 0; }
  .dsh-record-main-head { padding-left: 16px; padding-right: 16px; }
  .dsh-record-tabs { padding-left: 16px; padding-right: 16px; }
  .dsh-record-col-template, .dsh-record-col-values { display: none; }
  .dsh-record-col-title { width: 40%; }
  .dsh-record-col-severity { width: 16%; }
  .dsh-record-col-occurred { width: 30%; }
  .dsh-record-col-actions { width: 14%; }
  .dsh-record-field-row { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .dsh-record-form-row { grid-template-columns: minmax(0, 1fr); }
  .dsh-record-search { max-width: none; }
}
    `

    function installStyle() {
      const existing = document.getElementById('dsh-record-style')
      if (existing !== null) {
        existing.textContent = CSS
        return () => {}
      }
      const element = document.createElement('style')
      element.id = 'dsh-record-style'
      element.textContent = CSS
      document.head.append(element)
      return () => { element.remove() }
    }

    /** One JSON request against this plugin's Host routes; failures carry code and status. */
    async function requestJson(method, path, body) {
      let response
      try {
        response = await fetch(`${API}/${path}`, {
          method,
          credentials: 'same-origin',
          headers: body === undefined ? undefined : { 'content-type': 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body),
        })
      } catch (_networkFailure) {
        throw new Error('network')
      }
      let data = null
      try { data = await response.json() } catch (_nonJson) { /* the status still carries the failure */ }
      if (!response.ok) {
        const error = new Error(data !== null && typeof data.message === 'string' ? data.message : 'request')
        error.code = data !== null && typeof data.error === 'string' ? data.error : 'http-error'
        error.status = response.status
        throw error
      }
      return data
    }

    /** Upload one file as raw bytes; the returned projection carries the new file id. */
    async function uploadFile(fieldKey, file) {
      const path = `upload?fieldKey=${encodeURIComponent(fieldKey)}&name=${encodeURIComponent(file.name)}`
      let response
      try {
        response = await fetch(`${API}/${path}`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': file.type === '' ? 'application/octet-stream' : file.type },
          body: file,
        })
      } catch (_networkFailure) {
        throw new Error('network')
      }
      let data = null
      try { data = await response.json() } catch (_nonJson) { /* the status still carries the failure */ }
      if (!response.ok) {
        const error = new Error(data !== null && typeof data.message === 'string' ? data.message : 'request')
        error.code = data !== null && typeof data.error === 'string' ? data.error : 'http-error'
        error.status = response.status
        throw error
      }
      if (data === null || typeof data !== 'object' || data.file === undefined || data.file === null) {
        throw new Error('request')
      }
      return data.file
    }

    function isStorageFailure(error) {
      return error !== null && typeof error === 'object'
        && (error.code === 'database-unavailable' || error.code === 'database-plugin-missing')
    }

    function failureText(error, t, fallbackKey) {
      if (error !== null && typeof error === 'object' && typeof error.message === 'string'
        && error.message !== 'network' && error.message !== 'request') return error.message
      if (error !== null && typeof error === 'object' && error.message === 'network') return t('error.request')
      return t(fallbackKey)
    }

    function fieldTypeLabel(t, type) {
      if (type === 'number') return t('field.type.number')
      if (type === 'text') return t('field.type.text')
      if (type === 'boolean') return t('field.type.boolean')
      if (type === 'file') return t('field.type.file')
      return String(type)
    }

    function severityLabel(t, severity) {
      if (severity === 'low') return t('severity.low')
      if (severity === 'medium') return t('severity.medium')
      if (severity === 'high') return t('severity.high')
      if (severity === 'critical') return t('severity.critical')
      return t('severity.none')
    }

    function toLocalInput(value) {
      const date = value === null || value === undefined || value === '' ? new Date() : new Date(value)
      if (Number.isNaN(date.getTime())) return ''
      const pad = number => String(number).padStart(2, '0')
      return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
        + `T${pad(date.getHours())}:${pad(date.getMinutes())}`
    }

    function isoFromLocalInput(value) {
      if (typeof value !== 'string' || value === '') return null
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return null
      return date.toISOString()
    }

    function formatDateTime(value) {
      if (typeof value !== 'string' || value === '') return '—'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return value
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    function formatBytes(size) {
      const bytes = typeof size === 'number' && Number.isFinite(size) ? size : 0
      if (bytes <= 0) return ''
      if (bytes < 1024) return `${String(bytes)} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    function buildChildren(nodes) {
      const byParent = new Map()
      for (const node of nodes) {
        const key = node.parentId === null || node.parentId === undefined ? '' : String(node.parentId)
        const list = byParent.get(key)
        if (list === undefined) byParent.set(key, [node])
        else list.push(node)
      }
      for (const list of byParent.values()) {
        list.sort((left, right) => String(left.name).localeCompare(String(right.name)))
      }
      return byParent
    }

    function initialFieldValues(template, record) {
      const values = {}
      if (template === null || template === undefined) return values
      const fields = Array.isArray(template.fields) ? template.fields : []
      const source = record !== null && record !== undefined && record.values !== null
        && typeof record.values === 'object' ? record.values : {}
      const files = record !== null && record !== undefined && Array.isArray(record.files) ? record.files : []
      for (const field of fields) {
        const value = source[field.key]
        if (field.type === 'number') values[field.key] = value === undefined || value === null ? '' : String(value)
        else if (field.type === 'text') values[field.key] = typeof value === 'string' ? value : ''
        else if (field.type === 'boolean') values[field.key] = value === true ? 'true' : 'false'
        else if (Array.isArray(value)) {
          values[field.key] = value.map((id) => {
            const file = files.find(item => item.id === id)
            if (file !== undefined) return file
            return { id, name: String(id), kind: field.type, contentUrl: '', downloadUrl: '' }
          })
        } else values[field.key] = []
      }
      return values
    }

    function recordSummary(t, record, template) {
      const items = []
      const fields = template !== null && template !== undefined && Array.isArray(template.fields) ? template.fields : []
      const values = record.values !== null && typeof record.values === 'object' ? record.values : {}
      for (const field of fields) {
        if (field.type === 'file') continue
        const value = values[field.key]
        if (value === undefined || value === null || String(value).trim() === '') continue
        const text = field.type === 'boolean' ? t(value === true ? 'value.yes' : 'value.no') : String(value)
        items.push(`${String(field.label)}: ${text}`)
        if (items.length >= 3) break
      }
      return items
    }

    function useAlive() {
      const aliveRef = useRef(true)
      useEffect(() => {
        aliveRef.current = true
        return () => { aliveRef.current = false }
      }, [])
      return aliveRef
    }

    let localIdCounter = 0
    function newLocalId() {
      localIdCounter += 1
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
      return `local-${String(localIdCounter)}`
    }

    function PanelIcon({ size = 16, active = false }) {
      const strokeWidth = active ? 1.6 : 1.35
      return h('svg', {
        width: size, height: size, viewBox: '0 0 16 16',
        fill: 'none', 'aria-hidden': 'true', focusable: 'false',
      },
      h('path', {
        d: 'M8 1.9a4.1 4.1 0 0 1 4.1 4.1v2.6l1.1 2.2H2.8l1.1-2.2V6A4.1 4.1 0 0 1 8 1.9Z',
        stroke: 'currentColor',
        strokeWidth,
        strokeLinejoin: 'round',
      }),
      h('path', { d: 'M6.4 12.9a1.7 1.7 0 0 0 3.2 0', stroke: 'currentColor', strokeWidth, strokeLinecap: 'round' }))
    }

    const ICON_PATHS = {
      folder: 'M1.75 4.25c0-.55.45-1 1-1h3.1c.3 0 .58.13.77.36l.63.79h5c.55 0 1 .45 1 1v6.35c0 .55-.45 1-1 1h-9.5c-.55 0-1-.45-1-1V4.25Z',
      folderOpen: 'M1.75 5.6c0-.5.4-.9.9-.9h3.2c.28 0 .55.13.72.35l.6.75h5.18c.5 0 .9.4.9.9v4.9c0 .5-.4.9-.9.9H2.65c-.5 0-.9-.4-.9-.9V5.6Z',
      chevron: 'M6 4l4 4-4 4',
      plus: 'M8 3.25v9.5M3.25 8h9.5',
      refresh: 'M13.3 8a5.3 5.3 0 1 1-1.55-3.75M13.3 2.6v3h-3',
      edit: 'M10.9 2.6l2.5 2.5-7.6 7.6-3.2.7.7-3.2 7.6-7.6Z',
      trash: 'M3.5 4.5h9M6 4.5V3.2c0-.4.32-.7.7-.7h2.6c.38 0 .7.3.7.7v1.3M4.4 4.5l.55 8.1c.03.48.43.85.9.85h4.3c.47 0 .87-.37.9-.85l.55-8.1',
      close: 'M4 4l8 8M12 4l-8 8',
      file: 'M9 1.8H4.6c-.5 0-.9.4-.9.9v10.6c0 .5.4.9.9.9h6.8c.5 0 .9-.4.9-.9V5.2L9 1.8Zm0 0v3.4h3.4',
      search: 'M7.2 2.5a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm3.4 8.1 2.9 2.9',
      check: 'M3.2 8.3l3 3 6.6-6.7',
    }

    function Icon({ name, size = 14, className }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none',
        'aria-hidden': 'true', focusable: 'false', className,
      }, h('path', {
        d: ICON_PATHS[name] === undefined ? ICON_PATHS.file : ICON_PATHS[name],
        stroke: 'currentColor',
        strokeWidth: 1.4,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }))
    }

    function Skeleton({ label, rows = 4 }) {
      return h('div', { className: 'dsh-record-skeleton', role: 'status', 'aria-label': label },
        Array.from({ length: rows }, (_unused, index) => h('div', {
          key: String(index),
          className: 'dsh-record-skeleton-row',
        })))
    }

    function Badge({ label, value, title }) {
      return h('span', { className: 'dsh-record-badge', title },
        label === undefined || label === '' ? null : h('span', null, label),
        h('strong', null, value))
    }

    /**
     * Rounded dropdown standing in for a native select so the option list can be
     * shaped with the page's own surfaces. The menu is viewport-positioned and
     * flips above the control when there is not enough room below.
     */
    function Select({ id, value, options, onChange, disabled, ariaLabel }) {
      const [open, setOpen] = useState(false)
      const [activeIndex, setActiveIndex] = useState(0)
      const [anchor, setAnchor] = useState(null)
      const buttonRef = useRef(null)
      const menuRef = useRef(null)
      const selectedIndex = Math.max(0, options.findIndex(option => option.value === value))
      const selected = options[selectedIndex]

      useEffect(() => {
        if (!open) return undefined
        const measure = () => {
          const button = buttonRef.current
          if (button === null) return
          const rect = button.getBoundingClientRect()
          const wanted = Math.min(290, options.length * 34 + 10)
          const below = window.innerHeight - rect.bottom - 16
          const above = rect.top - 16
          const openUp = below < wanted && above > below
          const available = Math.max(96, Math.min(290, openUp ? above : below))
          setAnchor({
            left: Math.round(rect.left),
            width: Math.round(rect.width),
            maxHeight: Math.round(available),
            ...(openUp ? { bottom: Math.round(window.innerHeight - rect.top + 4) } : { top: Math.round(rect.bottom + 4) }),
          })
        }
        measure()
        const onPointerDown = (event) => {
          const target = event.target
          if (buttonRef.current !== null && buttonRef.current.contains(target)) return
          if (menuRef.current !== null && menuRef.current.contains(target)) return
          setOpen(false)
        }
        const onViewportChange = () => measure()
        window.addEventListener('resize', onViewportChange)
        window.addEventListener('scroll', onViewportChange, true)
        document.addEventListener('pointerdown', onPointerDown, true)
        return () => {
          window.removeEventListener('resize', onViewportChange)
          window.removeEventListener('scroll', onViewportChange, true)
          document.removeEventListener('pointerdown', onPointerDown, true)
        }
      }, [open, options.length])

      const choose = (index) => {
        const option = options[index]
        if (option === undefined) return
        setOpen(false)
        onChange(option.value)
        if (buttonRef.current !== null) buttonRef.current.focus()
      }

      const onKeyDown = (event) => {
        if (disabled === true) return
        if (!open) {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setActiveIndex(selectedIndex)
            setOpen(true)
          }
          return
        }
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); return }
        if (event.key === 'Tab') { setOpen(false); return }
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          setActiveIndex(index => Math.min(index + 1, options.length - 1))
          return
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          setActiveIndex(index => Math.max(index - 1, 0))
          return
        }
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(activeIndex) }
      }

      const menu = open && anchor !== null
        ? h('ul', {
          ref: menuRef,
          className: 'dsh-record-select-menu',
          role: 'listbox',
          'aria-label': ariaLabel,
          style: {
            position: 'fixed',
            left: `${String(anchor.left)}px`,
            minWidth: `${String(anchor.width)}px`,
            maxHeight: `${String(anchor.maxHeight)}px`,
            zIndex: 1100,
            ...(anchor.top === undefined ? { bottom: `${String(anchor.bottom)}px` } : { top: `${String(anchor.top)}px` }),
          },
        }, options.map((option, index) => h('li', { key: option.value === '' ? '__none' : option.value, role: 'none' },
          h('button', {
            type: 'button',
            role: 'option',
            className: 'dsh-record-select-option',
            'aria-selected': option.value === value ? 'true' : 'false',
            'data-active': index === activeIndex ? 'true' : 'false',
            onMouseEnter: () => setActiveIndex(index),
            onClick: () => choose(index),
          },
          h('span', null, option.label),
          option.value === value ? h(Icon, { name: 'check', size: 11 }) : null))))
        : null

      return h('div', { className: 'dsh-record-select-wrap' },
        h('button', {
          ref: buttonRef,
          id,
          type: 'button',
          className: 'dsh-record-select-control',
          'aria-haspopup': 'listbox',
          'aria-expanded': open ? 'true' : 'false',
          'aria-label': ariaLabel,
          disabled: disabled === true,
          onClick: () => {
            if (open) { setOpen(false); return }
            setActiveIndex(selectedIndex)
            setOpen(true)
          },
          onKeyDown,
        },
        h('span', { className: 'dsh-record-select-value' }, selected === undefined ? '' : selected.label),
        h(Icon, { name: 'chevron', size: 10 })),
        menu)
    }

    function SeverityBadge({ t, severity }) {
      const value = SEVERITIES.includes(severity) ? severity : ''
      const className = value === '' ? 'dsh-record-severity' : `dsh-record-severity dsh-record-severity-${value}`
      return h('span', { className }, severityLabel(t, value))
    }

    function Field({ label, htmlFor, children }) {
      return h('div', { className: 'dsh-record-field' },
        h('label', { className: 'dsh-record-field-label', htmlFor }, label),
        children)
    }

    function Dialog({ t, title, busy, wide, error, onClose, onSubmit, initialFocusRef, children, footer }) {
      useEffect(() => {
        const onKey = (event) => { if (event.key === 'Escape' && !busy) onClose() }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
      }, [busy, onClose])
      useEffect(() => {
        const target = initialFocusRef === undefined || initialFocusRef === null ? null : initialFocusRef.current
        if (target !== null) target.focus()
      }, [initialFocusRef])
      return h('div', {
        className: 'dsh-record-overlay',
        onMouseDown: (event) => { if (event.target === event.currentTarget && !busy) onClose() },
      },
      h('form', {
        className: wide === true ? 'dsh-record-dialog dsh-record-dialog-wide' : 'dsh-record-dialog',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': title,
        onSubmit: (event) => {
          event.preventDefault()
          if (typeof onSubmit === 'function') onSubmit()
        },
      },
      h('div', { className: 'dsh-record-dialog-head' },
        h('h2', null, title),
        h('button', {
          type: 'button',
          className: 'dsh-record-icon-button',
          'aria-label': t('action.close'),
          title: t('action.close'),
          disabled: busy,
          onClick: onClose,
        }, h(Icon, { name: 'close' }))),
      h('div', { className: 'dsh-record-dialog-body' },
        children,
        error === null || error === undefined ? null : h('p', { className: 'dsh-record-form-error', role: 'alert' }, error)),
      footer === null || footer === undefined ? null : h('div', { className: 'dsh-record-dialog-foot' }, footer)))
    }

    function ConfirmDialog({ t, title, body, busy, error, onCancel, onConfirm }) {
      return h(Dialog, {
        t,
        title,
        busy,
        error,
        onClose: onCancel,
        onSubmit: onConfirm,
        footer: [
          h('button', {
            key: 'cancel', type: 'button', className: 'dsh-record-button', disabled: busy, onClick: onCancel,
          }, t('action.cancel')),
          h('button', {
            key: 'confirm', type: 'submit', className: 'dsh-record-button dsh-record-button-danger', disabled: busy,
          }, busy ? t('action.deleting') : t('delete.confirm')),
        ],
        children: h('p', { className: 'dsh-record-detail-value' }, body),
      })
    }

    function NodeDialog({ t, mode, parentId, target, onClose, onSaved, onStorageFailure }) {
      const aliveRef = useAlive()
      const [name, setName] = useState(
        target === null || target === undefined || typeof target.name !== 'string' ? '' : target.name)
      const [description, setDescription] = useState(
        target === null || target === undefined || typeof target.description !== 'string' ? '' : target.description)
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState(null)
      const nameRef = useRef(null)
      const title = mode === 'edit' ? t('node.editTitle') : parentId === null ? t('node.createTitle') : t('node.childTitle')
      const submit = async () => {
        if (busy) return
        const trimmedName = name.trim()
        if (trimmedName === '') {
          setError(t('node.nameRequired'))
          return
        }
        setBusy(true)
        setError(null)
        try {
          if (mode === 'edit') {
            await requestJson('POST', 'nodes', {
              action: 'update',
              id: target.id,
              name: trimmedName,
              description: description.trim(),
            })
          } else {
            await requestJson('POST', 'nodes', {
              action: 'create',
              parentId,
              name: trimmedName,
              description: description.trim(),
            })
          }
          if (!aliveRef.current) return
          onSaved()
        } catch (reason) {
          if (!aliveRef.current) return
          if (isStorageFailure(reason)) {
            onClose()
            onStorageFailure(reason)
            return
          }
          setError(failureText(reason, t, 'node.saveFailed'))
        } finally {
          if (aliveRef.current) setBusy(false)
        }
      }
      return h(Dialog, {
        t,
        title,
        busy,
        error,
        onClose,
        onSubmit: () => { void submit() },
        initialFocusRef: nameRef,
        footer: [
          h('button', {
            key: 'cancel', type: 'button', className: 'dsh-record-button', disabled: busy, onClick: onClose,
          }, t('action.cancel')),
          h('button', {
            key: 'save', type: 'submit', className: 'dsh-record-button dsh-record-button-primary',
            disabled: busy || name.trim() === '',
          }, busy ? t('action.saving') : t('action.save')),
        ],
        children: [
          h(Field, { key: 'name', label: t('node.name'), htmlFor: 'dsh-record-node-name' },
            h('input', {
              ref: nameRef,
              id: 'dsh-record-node-name',
              className: 'dsh-record-input',
              value: name,
              maxLength: 120,
              placeholder: t('node.namePlaceholder'),
              onChange: (event) => { setName(event.target.value); setError(null) },
            })),
          h(Field, { key: 'description', label: t('node.description'), htmlFor: 'dsh-record-node-description' },
            h('textarea', {
              id: 'dsh-record-node-description',
              className: 'dsh-record-textarea',
              value: description,
              maxLength: 4000,
              placeholder: t('node.descriptionPlaceholder'),
              onChange: (event) => { setDescription(event.target.value); setError(null) },
            })),
        ],
      })
    }

    function TemplateDialog({ t, mode, template, nodeId, onClose, onSaved, onStorageFailure }) {
      const aliveRef = useAlive()
      const [name, setName] = useState(
        template === null || template === undefined || typeof template.name !== 'string' ? '' : template.name)
      const [description, setDescription] = useState(
        template === null || template === undefined || typeof template.description !== 'string' ? '' : template.description)
      const [rows, setRows] = useState(() => {
        const fields = template !== null && template !== undefined && Array.isArray(template.fields) ? template.fields : []
        if (fields.length === 0) return [{ clientId: newLocalId(), key: null, label: '', type: 'number', required: false }]
        return fields.map(field => ({
          clientId: newLocalId(),
          key: typeof field.key === 'string' ? field.key : null,
          label: field.label,
          type: field.type,
          required: field.required === true,
        }))
      })
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState(null)
      const nameRef = useRef(null)
      const setRow = (clientId, patch) => {
        setRows(current => current.map(row => row.clientId === clientId ? { ...row, ...patch } : row))
        setError(null)
      }
      const addRow = () => {
        setRows(current => {
          if (current.length >= MAX_FIELDS) return current
          return [...current, { clientId: newLocalId(), key: null, label: '', type: 'number', required: false }]
        })
        setError(null)
      }
      const removeRow = (clientId) => {
        setRows(current => current.filter(row => row.clientId !== clientId))
        setError(null)
      }
      const submit = async () => {
        if (busy) return
        const trimmedName = name.trim()
        if (trimmedName === '') {
          setError(t('template.dialog.nameRequired'))
          return
        }
        if (rows.length === 0) {
          setError(t('template.dialog.emptyField'))
          return
        }
        if (rows.some(row => row.label.trim() === '')) {
          setError(t('template.dialog.fieldRequired'))
          return
        }
        const fields = rows.map((row) => {
          const field = { label: row.label.trim(), type: row.type, required: row.required === true }
          if (row.key !== null && row.key !== undefined) field.key = row.key
          return field
        })
        setBusy(true)
        setError(null)
        try {
          if (mode === 'edit') {
            await requestJson('POST', 'templates', {
              action: 'update',
              id: template.id,
              name: trimmedName,
              description: description.trim(),
              fields,
            })
          } else {
            await requestJson('POST', 'templates', {
              action: 'create',
              nodeId,
              name: trimmedName,
              description: description.trim(),
              fields,
            })
          }
          if (!aliveRef.current) return
          onSaved()
        } catch (reason) {
          if (!aliveRef.current) return
          if (isStorageFailure(reason)) {
            onClose()
            onStorageFailure(reason)
            return
          }
          if (reason !== null && typeof reason === 'object' && reason.code === 'field-type-in-use') {
            setError(t('template.dialog.fieldTypeInUse'))
            return
          }
          setError(failureText(reason, t, 'template.dialog.saveFailed'))
        } finally {
          if (aliveRef.current) setBusy(false)
        }
      }
      return h(Dialog, {
        t,
        title: mode === 'edit' ? t('template.dialog.editTitle') : t('template.dialog.createTitle'),
        busy,
        wide: true,
        error,
        onClose,
        onSubmit: () => { void submit() },
        initialFocusRef: nameRef,
        footer: [
          h('button', {
            key: 'cancel', type: 'button', className: 'dsh-record-button', disabled: busy, onClick: onClose,
          }, t('action.cancel')),
          h('button', {
            key: 'save', type: 'submit', className: 'dsh-record-button dsh-record-button-primary', disabled: busy,
          }, busy ? t('action.saving') : t('action.save')),
        ],
        children: [
          h(Field, { key: 'name', label: t('template.dialog.name'), htmlFor: 'dsh-record-template-name' },
            h('input', {
              ref: nameRef,
              id: 'dsh-record-template-name',
              className: 'dsh-record-input',
              value: name,
              maxLength: 120,
              onChange: (event) => { setName(event.target.value); setError(null) },
            })),
          h(Field, { key: 'description', label: t('template.dialog.description'), htmlFor: 'dsh-record-template-description' },
            h('textarea', {
              id: 'dsh-record-template-description',
              className: 'dsh-record-textarea',
              value: description,
              maxLength: 4000,
              onChange: (event) => { setDescription(event.target.value); setError(null) },
            })),
          h('p', { key: 'fields-title', className: 'dsh-record-section-title' },
            `${t('template.dialog.fields')} · ${t('templates.fieldsCount', { count: String(rows.length) })}`),
          rows.map(row => h('div', { key: row.clientId, className: 'dsh-record-field-row' },
            h(Field, { label: t('template.dialog.fieldLabel'), htmlFor: `dsh-record-field-label-${row.clientId}` },
              h('input', {
                id: `dsh-record-field-label-${row.clientId}`,
                className: 'dsh-record-input',
                value: row.label,
                maxLength: 60,
                onChange: (event) => setRow(row.clientId, { label: event.target.value }),
              })),
            h(Field, { label: t('template.dialog.fieldType'), htmlFor: `dsh-record-field-type-${row.clientId}` },
              h(Select, {
                id: `dsh-record-field-type-${row.clientId}`,
                value: row.type,
                ariaLabel: t('template.dialog.fieldType'),
                options: FIELD_TYPES.map(type => ({ value: type, label: fieldTypeLabel(t, type) })),
                onChange: (next) => setRow(row.clientId, { type: next }),
              })),
            h('label', { className: 'dsh-record-checkbox' },
              h('input', {
                type: 'checkbox',
                checked: row.required,
                onChange: (event) => setRow(row.clientId, { required: event.target.checked }),
              }),
              h('span', null, t('template.dialog.required'))),
            h('button', {
              type: 'button',
              className: 'dsh-record-icon-button',
              'aria-label': t('action.removeField'),
              title: t('action.removeField'),
              disabled: busy || rows.length <= 1,
              onClick: () => removeRow(row.clientId),
            }, h(Icon, { name: 'trash' })))),
          h('div', { key: 'add' },
            h('button', {
              type: 'button',
              className: 'dsh-record-button',
              title: t('template.dialog.fieldLimit', { count: String(MAX_FIELDS) }),
              disabled: busy || rows.length >= MAX_FIELDS,
              onClick: addRow,
            }, h(Icon, { name: 'plus' }), t('action.addField'))),
        ],
      })
    }

    function FileEditor({ t, field, items, disabled, uploading, onPick, onRemove }) {
      const label = String(field.label)
      return h('div', { className: 'dsh-record-dynamic-item' },
        h('div', { className: 'dsh-record-field-label' }, label),
        items.length === 0 ? null : h('div', { className: 'dsh-record-uploads' },
          items.map(file => h('div', { key: file.id, className: 'dsh-record-upload-item' },
            file.kind === 'image' && typeof file.contentUrl === 'string' && file.contentUrl !== ''
              ? h('img', { className: 'dsh-record-thumb', src: file.contentUrl, alt: file.name, title: file.name })
              : h('span', { className: 'dsh-record-file-chip', title: file.name },
                h(Icon, { name: 'file', size: 12 }),
                h('span', { className: 'dsh-record-file-name' }, file.name)),
            h('button', {
              type: 'button',
              className: 'dsh-record-icon-button dsh-record-upload-remove',
              'aria-label': t('record.dialog.removeFile'),
              title: t('record.dialog.removeFile'),
              disabled,
              onClick: () => onRemove(file.id),
            }, h(Icon, { name: 'close', size: 10 }))))),
        h('input', {
          type: 'file',
          className: 'dsh-record-file-input',
          multiple: true,
          disabled,
          'aria-label': label,
          onChange: (event) => { void onPick(event) },
        }),
        uploading ? h('span', { className: 'dsh-record-field-hint' }, t('record.dialog.uploading')) : null)
    }

    function RecordDialog({ t, mode, record, nodeId, templates, onClose, onSaved, onStorageFailure }) {
      const aliveRef = useAlive()
      const initialTemplate = mode === 'edit' && record !== null && record !== undefined
        ? templates.find(item => item.id === record.templateId)
        : templates[0]
      const [templateId, setTemplateId] = useState(initialTemplate === undefined ? '' : initialTemplate.id)
      const [title, setTitle] = useState(
        mode === 'edit' && record !== null && record !== undefined && typeof record.title === 'string' ? record.title : '')
      const [occurredAt, setOccurredAt] = useState(() => toLocalInput(
        mode === 'edit' && record !== null && record !== undefined ? record.occurredAt : new Date().toISOString()))
      const [severity, setSeverity] = useState(
        mode === 'edit' && record !== null && record !== undefined
          && SEVERITIES.includes(record.severity) ? record.severity : '')
      const [note, setNote] = useState(
        mode === 'edit' && record !== null && record !== undefined && typeof record.note === 'string' ? record.note : '')
      const [values, setValues] = useState(() => initialFieldValues(
        initialTemplate === undefined ? null : initialTemplate,
        mode === 'edit' ? record : null))
      const [busy, setBusy] = useState(false)
      const [uploadingKey, setUploadingKey] = useState(null)
      const [error, setError] = useState(null)
      const titleRef = useRef(null)
      const template = templates.find(item => item.id === templateId)
      const fields = template !== undefined && Array.isArray(template.fields) ? template.fields : []
      const changeTemplate = (nextId) => {
        setTemplateId(nextId)
        const nextTemplate = templates.find(item => item.id === nextId)
        setValues(initialFieldValues(nextTemplate === undefined ? null : nextTemplate, null))
        setError(null)
      }
      const setFieldValue = (key, value) => {
        setValues(current => ({ ...current, [key]: value }))
        setError(null)
      }
      const removeFile = (key, fileId) => {
        setValues(current => {
          const existing = Array.isArray(current[key]) ? current[key] : []
          return { ...current, [key]: existing.filter(file => file.id !== fileId) }
        })
        setError(null)
      }
      const pickFiles = async (field, event) => {
        const input = event.target
        const picked = Array.from(input.files === undefined || input.files === null ? [] : input.files)
        input.value = ''
        if (picked.length === 0 || uploadingKey !== null) return
        setUploadingKey(field.key)
        setError(null)
        const uploaded = []
        try {
          for (const file of picked) uploaded.push(await uploadFile(field.key, file))
        } catch (reason) {
          if (aliveRef.current) {
            if (isStorageFailure(reason)) {
              onClose()
              onStorageFailure(reason)
            } else setError(failureText(reason, t, 'record.dialog.uploadFailed'))
          }
          return
        } finally {
          if (aliveRef.current) setUploadingKey(null)
        }
        if (!aliveRef.current) return
        setValues((current) => {
          const existing = Array.isArray(current[field.key]) ? current[field.key] : []
          return { ...current, [field.key]: [...existing, ...uploaded] }
        })
      }
      const submit = async () => {
        if (busy || uploadingKey !== null) return
        if (template === undefined) {
          setError(t('record.dialog.templateRequired'))
          return
        }
        const trimmedTitle = title.trim()
        if (trimmedTitle === '') {
          setError(t('record.dialog.titleRequired'))
          return
        }
        const nextValues = {}
        for (const field of fields) {
          const raw = values[field.key]
          if (field.type === 'number') {
            const text = typeof raw === 'string' ? raw.trim() : ''
            if (text === '') {
              if (field.required === true) {
                setError(t('record.dialog.requiredField', { label: field.label }))
                return
              }
              continue
            }
            const number = Number(text)
            if (!Number.isFinite(number)) {
              setError(t('record.dialog.numberInvalid', { label: field.label }))
              return
            }
            nextValues[field.key] = number
          } else if (field.type === 'text') {
            const text = typeof raw === 'string' ? raw : ''
            if (text.trim() === '' && field.required === true) {
              setError(t('record.dialog.requiredField', { label: field.label }))
              return
            }
            nextValues[field.key] = text
          } else if (field.type === 'boolean') {
            nextValues[field.key] = raw === 'true'
          } else {
            const ids = Array.isArray(raw) ? raw.map(file => file.id) : []
            if (ids.length === 0 && field.required === true) {
              setError(t('record.dialog.requiredField', { label: field.label }))
              return
            }
            nextValues[field.key] = ids
          }
        }
        const payload = { title: trimmedTitle, severity, note: note.trim(), values: nextValues }
        const occurredIso = isoFromLocalInput(occurredAt)
        if (occurredIso !== null) payload.occurredAt = occurredIso
        setBusy(true)
        setError(null)
        try {
          if (mode === 'edit') {
            await requestJson('POST', 'records', { action: 'update', id: record.id, record: payload })
          } else {
            await requestJson('POST', 'records', {
              action: 'create',
              record: {
                nodeId,
                templateId,
                title: trimmedTitle,
                severity,
                note: payload.note,
                values: nextValues,
                occurredAt: occurredIso === null ? new Date().toISOString() : occurredIso,
              },
            })
          }
          if (!aliveRef.current) return
          onSaved()
        } catch (reason) {
          if (!aliveRef.current) return
          if (isStorageFailure(reason)) {
            onClose()
            onStorageFailure(reason)
            return
          }
          setError(failureText(reason, t, 'record.dialog.saveFailed'))
        } finally {
          if (aliveRef.current) setBusy(false)
        }
      }
      const footer = [
        h('button', {
          key: 'cancel', type: 'button', className: 'dsh-record-button', disabled: busy, onClick: onClose,
        }, t('action.cancel')),
        h('button', {
          key: 'save', type: 'submit', className: 'dsh-record-button dsh-record-button-primary',
          disabled: busy || uploadingKey !== null,
        }, busy ? t('action.saving') : t('action.save')),
      ]
      return h(Dialog, {
        t,
        title: mode === 'edit' ? t('record.dialog.editTitle') : t('record.dialog.createTitle'),
        busy,
        wide: true,
        error,
        onClose,
        onSubmit: () => { void submit() },
        initialFocusRef: titleRef,
        footer,
        children: [
          h('div', { key: 'row', className: 'dsh-record-form-row' },
            h(Field, { label: t('record.dialog.template'), htmlFor: 'dsh-record-record-template' },
              h(Select, {
                id: 'dsh-record-record-template',
                value: templateId,
                ariaLabel: t('record.dialog.template'),
                disabled: busy || mode === 'edit',
                options: templates.length === 0
                  ? [{ value: '', label: t('record.dialog.templatePlaceholder') }]
                  : templates.map(item => ({ value: item.id, label: item.name })),
                onChange: changeTemplate,
              })),
            h(Field, { label: t('record.dialog.severity'), htmlFor: 'dsh-record-record-severity' },
              h(Select, {
                id: 'dsh-record-record-severity',
                value: severity,
                ariaLabel: t('record.dialog.severity'),
                disabled: busy,
                options: SEVERITIES.map(item => ({ value: item, label: severityLabel(t, item) })),
                onChange: setSeverity,
              })),
            h(Field, { label: t('record.dialog.occurredAt'), htmlFor: 'dsh-record-record-occurred' },
              h('input', {
                id: 'dsh-record-record-occurred',
                type: 'datetime-local',
                className: 'dsh-record-input',
                value: occurredAt,
                disabled: busy,
                onChange: (event) => setOccurredAt(event.target.value),
              }))),
          h(Field, { key: 'title', label: t('record.dialog.title'), htmlFor: 'dsh-record-record-title' },
            h('input', {
              ref: titleRef,
              id: 'dsh-record-record-title',
              className: 'dsh-record-input',
              value: title,
              maxLength: 160,
              placeholder: t('record.dialog.titlePlaceholder'),
              onChange: (event) => { setTitle(event.target.value); setError(null) },
            })),
          h(Field, { key: 'note', label: t('record.dialog.note'), htmlFor: 'dsh-record-record-note' },
            h('textarea', {
              id: 'dsh-record-record-note',
              className: 'dsh-record-textarea',
              value: note,
              maxLength: 4000,
              placeholder: t('record.dialog.notePlaceholder'),
              onChange: (event) => { setNote(event.target.value); setError(null) },
            })),
          h('p', { key: 'values-title', className: 'dsh-record-section-title' }, t('record.dialog.values')),
          fields.length === 0
            ? h('p', { key: 'no-values', className: 'dsh-record-field-hint' }, t('record.dialog.noTemplate'))
            : h('div', { key: 'values', className: 'dsh-record-dynamic' },
              fields.map((field) => {
                const raw = values[field.key]
                const label = String(field.label)
                if (field.type === 'number') {
                  return h('div', { key: field.key, className: 'dsh-record-dynamic-item' },
                    h(Field, { label, htmlFor: `dsh-record-value-${field.key}` },
                      h('input', {
                        id: `dsh-record-value-${field.key}`,
                        type: 'number',
                        step: 'any',
                        className: 'dsh-record-input',
                        value: typeof raw === 'string' ? raw : '',
                        disabled: busy,
                        onChange: (event) => setFieldValue(field.key, event.target.value),
                      })))
                }
                if (field.type === 'text') {
                  return h('div', { key: field.key, className: 'dsh-record-dynamic-item' },
                    h(Field, { label, htmlFor: `dsh-record-value-${field.key}` },
                      h('input', {
                        id: `dsh-record-value-${field.key}`,
                        type: 'text',
                        className: 'dsh-record-input',
                        value: typeof raw === 'string' ? raw : '',
                        disabled: busy,
                        onChange: (event) => setFieldValue(field.key, event.target.value),
                      })))
                }
                if (field.type === 'boolean') {
                  return h('div', { key: field.key, className: 'dsh-record-dynamic-item' },
                    h(Field, { label, htmlFor: `dsh-record-value-${field.key}` },
                      h(Select, {
                        id: `dsh-record-value-${field.key}`,
                        value: raw === 'true' ? 'true' : 'false',
                        ariaLabel: label,
                        disabled: busy,
                        options: [
                          { value: 'true', label: t('value.yes') },
                          { value: 'false', label: t('value.no') },
                        ],
                        onChange: (next) => setFieldValue(field.key, next),
                      })))
                }
                return h(FileEditor, {
                  key: field.key,
                  t,
                  field,
                  items: Array.isArray(raw) ? raw : [],
                  disabled: busy || uploadingKey !== null,
                  uploading: uploadingKey === field.key,
                  onPick: (event) => pickFiles(field, event),
                  onRemove: (fileId) => removeFile(field.key, fileId),
                })
              })),
        ],
      })
    }

    function RecordDetailDialog({ t, record, template, onClose }) {
      const closeRef = useRef(null)
      const values = record.values !== null && typeof record.values === 'object' ? record.values : {}
      const files = Array.isArray(record.files) ? record.files : []
      const filesById = new Map(files.map(file => [file.id, file]))
      const templateFields = template !== null && template !== undefined && Array.isArray(template.fields)
        ? template.fields : []
      const fields = templateFields.length > 0
        ? templateFields
        : Object.keys(values).map(key => ({ key, label: key, type: 'text', required: false }))
      const renderMedia = (file) => {
        if (file.kind === 'image') {
          return h('img', {
            className: 'dsh-record-detail-image',
            src: file.contentUrl,
            alt: file.name,
            title: file.name,
          })
        }
        if (file.kind === 'video') {
          return h('video', {
            className: 'dsh-record-detail-video',
            src: file.contentUrl,
            controls: true,
            preload: 'metadata',
          })
        }
        if (file.kind === 'audio') {
          return h('audio', {
            className: 'dsh-record-detail-audio',
            src: file.contentUrl,
            controls: true,
            preload: 'metadata',
          })
        }
        if (file.kind === 'pdf') {
          return h('a', {
            className: 'dsh-record-file-chip dsh-record-file-open',
            href: file.contentUrl,
            target: '_blank',
            rel: 'noreferrer',
            title: file.name,
          }, h(Icon, { name: 'file', size: 12 }),
          h('span', { className: 'dsh-record-file-name' }, file.name))
        }
        return h('span', { className: 'dsh-record-file-chip' }, h(Icon, { name: 'file', size: 12 }), file.name)
      }
      const renderValue = (field) => {
        const value = values[field.key]
        if (field.type === 'file') {
          const ids = Array.isArray(value) ? value : []
          const items = ids.map(id => filesById.get(id)).filter(file => file !== undefined)
          if (items.length === 0) {
            return h('p', { className: 'dsh-record-muted' }, t('record.detail.emptyValue'))
          }
          return h('div', { className: 'dsh-record-media-list' },
            items.map(file => h('div', { key: file.id, className: 'dsh-record-media' },
              renderMedia(file),
              h('div', { className: 'dsh-record-media-info' },
                h('span', { className: 'dsh-record-file-name', title: file.name }, file.name),
                file.sizeBytes === undefined ? null : h('span', { className: 'dsh-record-muted' }, formatBytes(file.sizeBytes)),
                h('a', {
                  className: 'dsh-record-link',
                  href: file.downloadUrl,
                  download: file.name,
                }, t('record.detail.download'))))))
        }
        if (value === undefined || value === null || String(value).trim() === '') {
          return h('p', { className: 'dsh-record-muted' }, t('record.detail.emptyValue'))
        }
        if (field.type === 'boolean') {
          return h('p', { className: 'dsh-record-detail-value' }, t(value === true ? 'value.yes' : 'value.no'))
        }
        return h('p', { className: 'dsh-record-detail-value' }, String(value))
      }
      return h(Dialog, {
        t,
        title: t('record.detail.title'),
        wide: true,
        onClose,
        initialFocusRef: closeRef,
        children: [
          h('div', { key: 'head', className: 'dsh-record-detail-head' },
            h('h3', { className: 'dsh-record-detail-title' }, record.title),
            h('div', { className: 'dsh-record-badges' },
              h(SeverityBadge, { t, severity: record.severity }),
              h('span', { className: 'dsh-record-muted' }, record.templateName),
              h('span', { className: 'dsh-record-muted' }, formatDateTime(record.occurredAt)))),
          fields.length === 0
            ? h('p', { key: 'empty', className: 'dsh-record-muted' }, t('record.detail.noValues'))
            : h('div', { key: 'fields', className: 'dsh-record-detail-list' },
              fields.map(field => h('div', { key: field.key, className: 'dsh-record-detail-item' },
                h('span', { className: 'dsh-record-detail-label' },
                  `${String(field.label)} · ${fieldTypeLabel(t, field.type)}`),
                renderValue(field)))),
          record.note === undefined || record.note === ''
            ? null
            : h('div', { key: 'note', className: 'dsh-record-detail-item' },
              h('span', { className: 'dsh-record-detail-label' }, t('record.detail.note')),
              h('p', { className: 'dsh-record-detail-value' }, record.note)),
          h('div', { key: 'stamps', className: 'dsh-record-detail-item' },
            h('span', { className: 'dsh-record-detail-label' },
              `${t('record.detail.createdAt')} · ${formatDateTime(record.createdAt)}`),
            h('span', { className: 'dsh-record-detail-label' },
              `${t('record.detail.updatedAt')} · ${formatDateTime(record.updatedAt)}`)),
        ],
        footer: [
          h('button', {
            key: 'close', ref: closeRef, type: 'button', className: 'dsh-record-button', onClick: onClose,
          }, t('action.close')),
        ],
      })
    }

    /** @returns the remembered directory column width, clamped to the usable range. */
    function readSidebarWidth() {
      try {
        const raw = window.localStorage.getItem(SIDEBAR_WIDTH_KEY)
        const value = raw === null ? NaN : Number(raw)
        if (!Number.isFinite(value)) return DEFAULT_SIDEBAR_WIDTH
        return Math.min(Math.max(Math.round(value), MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH)
      } catch (_storageUnavailable) {
        return DEFAULT_SIDEBAR_WIDTH
      }
    }

    function AlertRecordsPage(props) {
      const { t, openDatabasePlugin } = props
      const aliveRef = useAlive()
      const treeGeneration = useRef(0)
      const templateGeneration = useRef(0)
      const recordGeneration = useRef(0)
      const bodyRef = useRef(null)
      const [sidebarWidth, setSidebarWidth] = useState(readSidebarWidth)
      const [resizing, setResizing] = useState(false)
      const [treeStatus, setTreeStatus] = useState('loading')
      const [treeError, setTreeError] = useState(null)
      const [storage, setStorage] = useState(null)
      const [nodes, setNodes] = useState([])
      const [selectedId, setSelectedId] = useState(null)
      const [expanded, setExpanded] = useState([])
      const [tab, setTab] = useState('records')
      const [templates, setTemplates] = useState([])
      const [templatesStatus, setTemplatesStatus] = useState('idle')
      const [templatesError, setTemplatesError] = useState(null)
      const [records, setRecords] = useState([])
      const [recordsTotal, setRecordsTotal] = useState(0)
      const [recordsStatus, setRecordsStatus] = useState('idle')
      const [recordsError, setRecordsError] = useState(null)
      const [recordsPage, setRecordsPage] = useState(1)
      const [recordsPageSize, setRecordsPageSize] = useState(20)
      const [templateFilter, setTemplateFilter] = useState('')
      const [queryDraft, setQueryDraft] = useState('')
      const [query, setQuery] = useState('')
      const [refreshToken, setRefreshToken] = useState(0)
      const [fatal, setFatal] = useState(null)
      const [nodeDialog, setNodeDialog] = useState(null)
      const [templateDialog, setTemplateDialog] = useState(null)
      const [recordDialog, setRecordDialog] = useState(null)
      const [detail, setDetail] = useState(null)
      const [deleteTarget, setDeleteTarget] = useState(null)
      const [deleteBusy, setDeleteBusy] = useState(false)
      const [deleteError, setDeleteError] = useState(null)
      const [selectedRecordIds, setSelectedRecordIds] = useState([])
      const [batchConfirm, setBatchConfirm] = useState(false)
      const [batchBusy, setBatchBusy] = useState(false)
      const [batchError, setBatchError] = useState(null)
      const [batchNotice, setBatchNotice] = useState(null)
      const nodeMap = useMemo(() => {
        const map = new Map()
        for (const node of nodes) map.set(node.id, node)
        return map
      }, [nodes])
      const byParent = useMemo(() => buildChildren(nodes), [nodes])
      const templateMap = useMemo(() => {
        const map = new Map()
        for (const template of templates) map.set(template.id, template)
        return map
      }, [templates])
      const selectedNode = selectedId === null ? null : nodeMap.get(selectedId) ?? null
      const detailsTemplate = detail === null ? null : templateMap.get(detail.templateId) ?? null
      const reportStorageFailure = (reason) => {
        setFatal({ code: reason.code })
      }
      const fail = (reason) => {
        if (!isStorageFailure(reason)) return false
        reportStorageFailure(reason)
        return true
      }
      const clampSidebarWidth = value => Math.min(Math.max(Math.round(value), MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH)
      useEffect(() => {
        try {
          window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth))
        } catch (_storageUnavailable) {
          // The width still applies for this session when storage is unavailable.
        }
      }, [sidebarWidth])
      /** Start a pointer drag that resizes the directory column. */
      const startResize = (event) => {
        const body = bodyRef.current
        if (body === null) return
        event.preventDefault()
        const rect = body.getBoundingClientRect()
        if (typeof event.currentTarget.setPointerCapture === 'function') {
          try {
            event.currentTarget.setPointerCapture(event.pointerId)
          } catch (_noPointerCapture) {
            // Window listeners still track the drag without pointer capture.
          }
        }
        setResizing(true)
        const move = (moveEvent) => {
          const maximum = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, rect.width - 320))
          const next = Math.min(Math.max(moveEvent.clientX - rect.left, MIN_SIDEBAR_WIDTH), maximum)
          setSidebarWidth(clampSidebarWidth(next))
        }
        const finish = () => {
          setResizing(false)
          window.removeEventListener('pointermove', move)
          window.removeEventListener('pointerup', finish)
          window.removeEventListener('pointercancel', finish)
        }
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', finish)
        window.addEventListener('pointercancel', finish)
      }
      /** Resize the directory column with the arrow keys while the separator has focus. */
      const onSplitterKeyDown = (event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
        event.preventDefault()
        const step = event.shiftKey ? 48 : 16
        setSidebarWidth(current => clampSidebarWidth(current + (event.key === 'ArrowRight' ? step : -step)))
      }
      const loadTree = async () => {
        const generation = ++treeGeneration.current
        setTreeStatus(current => current === 'ready' ? 'refreshing' : 'loading')
        setTreeError(null)
        try {
          const data = await requestJson('GET', 'tree')
          if (!aliveRef.current || generation !== treeGeneration.current) return
          const nextNodes = Array.isArray(data.nodes) ? data.nodes : []
          setStorage({
            mode: data.mode === 'postgres' ? 'postgres' : 'local',
            media: data.media === 'minio' ? 'minio' : 'local',
          })
          setNodes(nextNodes)
          setTreeStatus('ready')
          setFatal(null)
          const stillThere = selectedId !== null && nextNodes.some(node => node.id === selectedId)
          if (!stillThere) {
            const root = nextNodes.find(node => node.parentId === null || node.parentId === undefined)
            setSelectedId(root === undefined ? null : root.id)
            setTemplateFilter('')
            setQuery('')
            setQueryDraft('')
            setTemplates([])
            setTemplatesStatus('idle')
            setRecords([])
            setRecordsTotal(0)
            setRecordsStatus('idle')
          }
          setExpanded((current) => {
            if (current.length > 0) return current
            return nextNodes
              .filter(node => node.parentId === null || node.parentId === undefined)
              .map(node => node.id)
          })
        } catch (reason) {
          if (!aliveRef.current || generation !== treeGeneration.current) return
          setTreeStatus('error')
          if (fail(reason)) return
          setTreeError(reason.message || t('error.request'))
        }
      }
      const loadTemplates = async (nodeId) => {
        if (nodeId === null) {
          setTemplates([])
          setTemplatesStatus('idle')
          return
        }
        const generation = ++templateGeneration.current
        setTemplatesStatus(current => current === 'ready' ? 'refreshing' : 'loading')
        setTemplatesError(null)
        try {
          const data = await requestJson('GET', `templates?nodeId=${encodeURIComponent(nodeId)}`)
          if (!aliveRef.current || generation !== templateGeneration.current) return
          setTemplates(Array.isArray(data.templates) ? data.templates : [])
          setTemplatesStatus('ready')
        } catch (reason) {
          if (!aliveRef.current || generation !== templateGeneration.current) return
          setTemplatesStatus('error')
          if (fail(reason)) return
          setTemplatesError(reason.message || t('error.request'))
        }
      }
      const loadRecords = async (nodeId) => {
        if (nodeId === null) {
          setRecords([])
          setRecordsTotal(0)
          setRecordsStatus('idle')
          return
        }
        const generation = ++recordGeneration.current
        setRecordsStatus(current => current === 'ready' ? 'refreshing' : 'loading')
        setRecordsError(null)
        const params = [`nodeId=${encodeURIComponent(nodeId)}`]
        if (templateFilter !== '') params.push(`templateId=${encodeURIComponent(templateFilter)}`)
        if (query.trim() !== '') params.push(`query=${encodeURIComponent(query.trim())}`)
        params.push(`limit=${String(recordsPageSize)}`)
        params.push(`offset=${String((recordsPage - 1) * recordsPageSize)}`)
        try {
          const data = await requestJson('GET', `records?${params.join('&')}`)
          if (!aliveRef.current || generation !== recordGeneration.current) return
          const nextRecords = Array.isArray(data.records) ? data.records : []
          const total = typeof data.total === 'number' ? data.total : nextRecords.length
          setRecords(nextRecords)
          setRecordsTotal(total)
          setRecordsStatus('ready')
          if (nextRecords.length === 0 && total > 0 && recordsPage > 1) {
            setRecordsPage(Math.max(1, Math.ceil(total / recordsPageSize)))
          }
        } catch (reason) {
          if (!aliveRef.current || generation !== recordGeneration.current) return
          setRecordsStatus('error')
          if (fail(reason)) return
          setRecordsError(reason.message || t('error.request'))
        }
      }
      const selectNode = (nodeId) => {
        if (nodeId === selectedId) return
        setSelectedId(nodeId)
        setRecordsPage(1)
        setTemplateFilter('')
        setQuery('')
        setQueryDraft('')
        setTemplates([])
        setTemplatesStatus('idle')
        setRecords([])
        setRecordsTotal(0)
        setRecordsStatus('idle')
      }
      const toggleExpanded = (nodeId) => {
        setExpanded(current => current.includes(nodeId)
          ? current.filter(item => item !== nodeId)
          : [...current, nodeId])
      }
      const refresh = () => {
        setRefreshToken(value => value + 1)
      }
      const confirmDelete = async () => {
        if (deleteTarget === null) return
        setDeleteBusy(true)
        setDeleteError(null)
        try {
          if (deleteTarget.kind === 'node') {
            await requestJson('POST', 'nodes', { action: 'delete', id: deleteTarget.id })
          } else if (deleteTarget.kind === 'template') {
            await requestJson('POST', 'templates', { action: 'delete', id: deleteTarget.id })
          } else {
            await requestJson('POST', 'records', { action: 'delete', id: deleteTarget.id })
          }
          if (!aliveRef.current) return
          setDeleteTarget(null)
          if (deleteTarget.kind === 'node' && selectedId === deleteTarget.id) setSelectedId(null)
          if (deleteTarget.kind === 'template' && templateFilter === deleteTarget.id) setTemplateFilter('')
          refresh()
        } catch (reason) {
          if (!aliveRef.current) return
          if (isStorageFailure(reason)) {
            setDeleteTarget(null)
            reportStorageFailure(reason)
            return
          }
          setDeleteError(reason.message || t('delete.failed'))
        } finally {
          if (aliveRef.current) setDeleteBusy(false)
        }
      }
      const toggleRecordSelection = (id) => {
        setSelectedRecordIds(current => current.includes(id)
          ? current.filter(item => item !== id)
          : [...current, id])
      }
      const toggleSelectAllRecords = () => {
        setSelectedRecordIds(current => current.length === records.length && records.length > 0
          ? []
          : records.map(record => record.id))
      }
      const deleteSelectedRecords = async () => {
        if (selectedRecordIds.length === 0) return
        setBatchBusy(true)
        setBatchError(null)
        setBatchNotice(null)
        const ids = [...selectedRecordIds]
        const failures = []
        for (const id of ids) {
          try {
            await requestJson('POST', 'records', { action: 'delete', id })
          } catch (reason) {
            if (isStorageFailure(reason)) {
              if (aliveRef.current) {
                setBatchBusy(false)
                setBatchConfirm(false)
                reportStorageFailure(reason)
              }
              return
            }
            failures.push({ id, message: reason.message || t('delete.failed') })
          }
        }
        if (!aliveRef.current) return
        setBatchBusy(false)
        setBatchConfirm(false)
        setSelectedRecordIds([])
        if (failures.length > 0) {
          const message = t('records.batchFailed', {
            count: String(failures.length),
            total: String(ids.length),
            message: failures[0].message,
          })
          setBatchError(message)
          setBatchNotice(message)
        }
        refresh()
      }
      const renderTreeRows = (parentId, depth) => {
        if (depth > 32) return []
        const key = parentId === null ? '' : String(parentId)
        const children = byParent.get(key) ?? []
        return children.map((node) => {
          const hasChildren = (byParent.get(node.id) ?? []).length > 0
          const isExpanded = hasChildren && expanded.includes(node.id)
          const row = h('div', {
            key: node.id,
            className: node.id === selectedId ? 'dsh-record-tree-row dsh-record-tree-row-selected' : 'dsh-record-tree-row',
            style: { paddingLeft: `${String(8 + depth * 14)}px` },
            role: 'treeitem',
            'aria-selected': node.id === selectedId,
            'aria-expanded': hasChildren ? isExpanded : undefined,
            tabIndex: 0,
            title: node.description === '' ? node.name : `${node.name} — ${node.description}`,
            onClick: () => { selectNode(node.id) },
            onKeyDown: (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                selectNode(node.id)
              }
            },
          },
          h('button', {
            type: 'button',
            className: 'dsh-record-tree-chevron',
            'aria-label': isExpanded ? t('tree.collapse') : t('tree.expand'),
            onClick: (event) => {
              event.stopPropagation()
              if (hasChildren) toggleExpanded(node.id)
            },
            style: { visibility: hasChildren ? 'visible' : 'hidden' },
          }, h(Icon, {
            name: 'chevron',
            size: 12,
            className: isExpanded ? undefined : 'dsh-record-chevron-closed',
          })),
          h('span', { className: 'dsh-record-tree-icon' },
            h(Icon, { name: isExpanded ? 'folderOpen' : 'folder', size: 14 })),
          h('span', { className: 'dsh-record-tree-label', title: node.name }, node.name),
          h('span', {
            className: 'dsh-record-tree-count',
            title: t('tree.recordCount', { count: String(typeof node.recordCount === 'number' ? node.recordCount : 0) }),
          }, String(typeof node.recordCount === 'number' ? node.recordCount : 0)),
          h('span', { className: 'dsh-record-tree-actions' },
            depth === 0 ? h('button', {
              type: 'button',
              className: 'dsh-record-tree-action',
              'aria-label': t('tree.newChild'),
              title: t('tree.newChild'),
              onClick: (event) => {
                event.stopPropagation()
                selectNode(node.id)
                setExpanded(current => current.includes(node.id) ? current : [...current, node.id])
                setNodeDialog({ mode: 'create', parentId: node.id, target: null })
              },
            }, h(Icon, { name: 'plus', size: 12 })) : null,
            h('button', {
              type: 'button',
              className: 'dsh-record-tree-action',
              'aria-label': t('tree.rename'),
              title: t('tree.rename'),
              onClick: (event) => {
                event.stopPropagation()
                selectNode(node.id)
                setNodeDialog({ mode: 'edit', parentId: node.parentId, target: node })
              },
            }, h(Icon, { name: 'edit', size: 12 })),
            h('button', {
              type: 'button',
              className: 'dsh-record-tree-action dsh-record-tree-action-danger',
              'aria-label': t('tree.delete'),
              title: t('tree.delete'),
              onClick: (event) => {
                event.stopPropagation()
                selectNode(node.id)
                setDeleteError(null)
                setDeleteTarget({ kind: 'node', id: node.id, name: node.name })
              },
            }, h(Icon, { name: 'trash', size: 12 }))))
          const nested = isExpanded ? renderTreeRows(node.id, depth + 1) : null
          return h(React.Fragment, { key: node.id }, row, nested)
        })
      }
      useEffect(() => { void loadTree() }, [refreshToken])
      useEffect(() => { void loadTemplates(selectedId) }, [selectedId, refreshToken])
      useEffect(() => { void loadRecords(selectedId) }, [selectedId, templateFilter, query, refreshToken, recordsPage, recordsPageSize])
      useEffect(() => { setSelectedRecordIds([]) }, [selectedId, templateFilter, query, recordsPage, recordsPageSize])
      useEffect(() => {
        if (queryDraft === query) return undefined
        const timer = window.setTimeout(() => { setRecordsPage(1); setQuery(queryDraft) }, 300)
        return () => window.clearTimeout(timer)
      }, [queryDraft, query])
      const treePane = h('aside', {
        className: 'dsh-record-sidebar',
        style: { width: `${String(sidebarWidth)}px` },
      },
        h('div', { className: 'dsh-record-sidebar-head' },
          h('span', { className: 'dsh-record-sidebar-title' }, t('tree.title')),
          h('span', { className: 'dsh-record-muted' }, String(nodes.length))),
        h('div', { className: 'dsh-record-sidebar-tools' },
          h('button', {
            type: 'button',
            className: 'dsh-record-icon-button',
            'aria-label': t('tree.newRoot'),
            title: t('tree.newRoot'),
            onClick: () => setNodeDialog({ mode: 'create', parentId: null, target: null }),
          }, h(Icon, { name: 'plus' })),
          h('button', {
            type: 'button',
            className: 'dsh-record-icon-button',
            'aria-label': t('action.refresh'),
            title: t('action.refresh'),
            disabled: treeStatus === 'refreshing',
            onClick: refresh,
          }, h(Icon, { name: 'refresh' }))),
        treeError === null ? null : h('div', { className: 'dsh-record-tree-error', role: 'alert' },
          h('p', null, treeError),
          h('button', {
            type: 'button', className: 'dsh-record-button', onClick: refresh,
          }, t('action.retry'))),
        h('div', { className: 'dsh-record-tree', role: 'tree' },
          treeStatus === 'loading' && nodes.length === 0
            ? h('div', { className: 'dsh-record-tree-empty' }, h(Skeleton, { label: t('tree.loading'), rows: 3 }))
            : nodes.length === 0
              ? h('div', { className: 'dsh-record-tree-empty' }, t('tree.empty'))
              : renderTreeRows(null, 0)))
      const tabs = h('div', { className: 'dsh-record-tabs', role: 'tablist' },
        h('button', {
          type: 'button',
          role: 'tab',
          'aria-selected': tab === 'records',
          className: tab === 'records' ? 'dsh-record-tab dsh-record-tab-active' : 'dsh-record-tab',
          onClick: () => setTab('records'),
        }, t('tabs.records')),
        h('button', {
          type: 'button',
          role: 'tab',
          'aria-selected': tab === 'templates',
          className: tab === 'templates' ? 'dsh-record-tab dsh-record-tab-active' : 'dsh-record-tab',
          onClick: () => setTab('templates'),
        }, t('tabs.templates')))
      const recordsToolbar = h('div', { className: 'dsh-record-toolbar' },
        h('div', { className: 'dsh-record-inline-field' },
          h('span', null, t('records.templateFilter')),
          h(Select, {
            value: templateFilter,
            ariaLabel: t('records.templateFilter'),
            options: [{ value: '', label: t('records.allTemplates') }, ...templates.map(template => ({ value: template.id, label: template.name }))],
            onChange: (next) => { setRecordsPage(1); setTemplateFilter(next) },
          })),
        h('label', { className: 'dsh-record-inline-field dsh-record-search' },
          h('span', null, t('records.search')),
          h('input', {
            type: 'search',
            className: 'dsh-record-input',
            value: queryDraft,
            placeholder: t('records.searchPlaceholder'),
            onChange: (event) => setQueryDraft(event.target.value),
          })),
        h('button', {
          type: 'button',
          className: 'dsh-record-button',
          disabled: recordsStatus === 'refreshing',
          onClick: refresh,
        }, h(Icon, { name: 'refresh', size: 12 }),
        recordsStatus === 'refreshing' ? t('action.refreshing') : t('action.refresh')),
        h('button', {
          type: 'button',
          className: 'dsh-record-button dsh-record-button-primary',
          disabled: templates.length === 0,
          title: templates.length === 0 ? t('record.dialog.noTemplate') : undefined,
          onClick: () => setRecordDialog({ mode: 'create', record: null }),
        }, h(Icon, { name: 'plus', size: 12 }), t('records.new')))
      const selectionBar = selectedRecordIds.length === 0 ? null : h('div', {
        className: 'dsh-record-selection-bar',
        role: 'status',
      },
      h('span', null, t('records.selected', { count: String(selectedRecordIds.length) })),
      h('div', { className: 'dsh-record-selection-actions' },
        h('button', {
          type: 'button',
          className: 'dsh-record-small-button',
          onClick: () => setSelectedRecordIds([]),
        }, t('records.clearSelection')),
        h('button', {
          type: 'button',
          className: 'dsh-record-small-button dsh-record-small-button-danger',
          onClick: () => {
            setBatchError(null)
            setBatchConfirm(true)
          },
        }, h(Icon, { name: 'trash', size: 12 }), t('records.batchDelete'))))
      const recordsBody = recordsStatus === 'loading' && records.length === 0
        ? h('div', { className: 'dsh-record-panel' },
          h('div', { style: { padding: '12px' } }, h(Skeleton, { label: t('records.loading'), rows: 5 })))
        : records.length === 0
          ? h('section', { className: 'dsh-record-empty' },
            h('h2', null, query === '' && templateFilter === '' ? t('records.emptyTitle') : t('records.emptyFilteredTitle')),
            h('p', null, query === '' && templateFilter === '' ? t('records.emptyBody') : t('records.emptyFilteredBody')),
            templates.length === 0
              ? h('button', {
                type: 'button',
                className: 'dsh-record-button dsh-record-button-primary',
                onClick: () => setTemplateDialog({ mode: 'create', template: null }),
              }, t('templates.emptyAction'))
              : h('button', {
                type: 'button',
                className: 'dsh-record-button dsh-record-button-primary',
                onClick: () => setRecordDialog({ mode: 'create', record: null }),
              }, t('records.new')))
          : h('section', { className: 'dsh-record-panel' },
            h('div', { className: 'dsh-record-table-wrap' },
              h('table', { className: 'dsh-record-table' },
                h('thead', null,
                  h('tr', null,
                    h('th', { className: 'dsh-record-col-select' },
                      h('input', {
                        type: 'checkbox',
                        checked: records.length > 0 && selectedRecordIds.length === records.length,
                        'aria-label': t('records.selectAll'),
                        onChange: toggleSelectAllRecords,
                      })),
                    h('th', { className: 'dsh-record-col-title' }, t('records.columnTitle')),
                    h('th', { className: 'dsh-record-col-severity' }, t('records.columnSeverity')),
                    h('th', { className: 'dsh-record-col-template' }, t('records.columnTemplate')),
                    h('th', { className: 'dsh-record-col-occurred' }, t('records.columnOccurred')),
                    h('th', { className: 'dsh-record-col-values' }, t('records.columnValues')),
                    h('th', { className: 'dsh-record-col-actions' }, t('records.columnActions')))),
                h('tbody', null, records.map((record) => {
                  const template = templateMap.get(record.templateId) ?? null
                  const summary = recordSummary(t, record, template)
                  const fileCount = Array.isArray(record.files) ? record.files.length : 0
                  const checked = selectedRecordIds.includes(record.id)
                  return h('tr', { key: record.id, className: checked ? 'dsh-record-row-selected' : undefined },
                    h('td', { className: 'dsh-record-checkbox-cell' },
                      h('input', {
                        type: 'checkbox',
                        checked,
                        'aria-label': t('records.selectRow', { title: record.title }),
                        onChange: () => toggleRecordSelection(record.id),
                      })),
                    h('td', null, h('span', { className: 'dsh-record-row-title', title: record.title }, record.title)),
                    h('td', null, h(SeverityBadge, { t, severity: record.severity })),
                    h('td', null, h('span', { className: 'dsh-record-row-template', title: record.templateName }, record.templateName)),
                    h('td', null, h('span', { className: 'dsh-record-muted' }, formatDateTime(record.occurredAt))),
                    h('td', null,
                      h('div', { className: 'dsh-record-summary' },
                        summary.length === 0
                          ? h('span', { className: 'dsh-record-muted' }, t('record.detail.emptyValue'))
                          : summary.map((text, index) => h('span', {
                            key: `${record.id}-${String(index)}`,
                            className: 'dsh-record-chip',
                            title: text,
                          }, text)),
                        fileCount === 0
                          ? null
                          : h('span', { className: 'dsh-record-chip' }, t('records.files', { count: String(fileCount) })))),
                    h('td', null,
                      h('div', { className: 'dsh-record-summary' },
                        h('button', {
                          type: 'button', className: 'dsh-record-small-button', onClick: () => setDetail(record),
                        }, t('action.view')),
                        h('button', {
                          type: 'button',
                          className: 'dsh-record-small-button',
                          onClick: () => setRecordDialog({ mode: 'edit', record }),
                        }, t('action.edit')),
                        h('button', {
                          type: 'button',
                          className: 'dsh-record-small-button dsh-record-small-button-danger',
                          onClick: () => {
                            setDeleteError(null)
                            setDeleteTarget({ kind: 'record', id: record.id, name: record.title })
                          },
                        }, t('action.delete')))))
                })))))
      const templatesToolbar = h('div', { className: 'dsh-record-toolbar' },
        h('button', {
          type: 'button',
          className: 'dsh-record-button dsh-record-button-primary',
          onClick: () => setTemplateDialog({ mode: 'create', template: null }),
        }, h(Icon, { name: 'plus', size: 12 }), t('action.newTemplate')),
        h('button', {
          type: 'button',
          className: 'dsh-record-button',
          disabled: templatesStatus === 'refreshing',
          onClick: refresh,
        }, h(Icon, { name: 'refresh', size: 12 }),
        templatesStatus === 'refreshing' ? t('action.refreshing') : t('action.refresh')))
      const templatesBody = templatesStatus === 'loading' && templates.length === 0
        ? h('div', { className: 'dsh-record-panel' },
          h('div', { style: { padding: '12px' } }, h(Skeleton, { label: t('templates.loading'), rows: 3 })))
        : templates.length === 0
          ? h('section', { className: 'dsh-record-empty' },
            h('h2', null, t('templates.emptyTitle')),
            h('p', null, t('templates.emptyBody')),
            h('button', {
              type: 'button',
              className: 'dsh-record-button dsh-record-button-primary',
              onClick: () => setTemplateDialog({ mode: 'create', template: null }),
            }, t('templates.emptyAction')))
          : h('div', { className: 'dsh-record-card-grid' }, templates.map((template) => {
            const fields = Array.isArray(template.fields) ? template.fields : []
            return h('article', { key: template.id, className: 'dsh-record-card' },
              h('div', { className: 'dsh-record-card-head' },
                h('div', { className: 'dsh-record-card-title' },
                  h('h2', { title: template.name }, template.name),
                  h('span', { className: 'dsh-record-muted' },
                    `${t('templates.fieldsCount', { count: String(fields.length) })} · `
                    + t('templates.recordCount', { count: String(typeof template.recordCount === 'number' ? template.recordCount : 0) }))),
                h('div', { className: 'dsh-record-card-actions' },
                  h('button', {
                    type: 'button',
                    className: 'dsh-record-tree-action',
                    'aria-label': t('action.edit'),
                    title: t('action.edit'),
                    onClick: () => setTemplateDialog({ mode: 'edit', template }),
                  }, h(Icon, { name: 'edit', size: 12 })),
                  h('button', {
                    type: 'button',
                    className: 'dsh-record-tree-action dsh-record-tree-action-danger',
                    'aria-label': t('action.delete'),
                    title: t('action.delete'),
                    onClick: () => {
                      setDeleteError(null)
                      setDeleteTarget({ kind: 'template', id: template.id, name: template.name })
                    },
                  }, h(Icon, { name: 'trash', size: 12 })))),
              template.description === '' ? null : h('p', {
                className: 'dsh-record-card-desc',
                title: template.description,
              }, template.description),
              h('div', { className: 'dsh-record-chips' }, fields.map(field => h('span', {
                key: field.key,
                className: 'dsh-record-chip',
                title: `${String(field.label)} · ${fieldTypeLabel(t, field.type)}`,
              },
              h('span', { className: 'dsh-record-chip-label' }, field.label),
              h('span', { className: 'dsh-record-chip-type' }, fieldTypeLabel(t, field.type)),
              field.required === true
                ? h('span', { className: 'dsh-record-chip-required', 'aria-label': t('template.dialog.required') }, '*')
                : null))))
          }))
      const recordsPageCount = Math.max(1, Math.ceil(recordsTotal / recordsPageSize))
      const recordsPager = recordsTotal === 0 ? null : h('div', {
        className: 'dsh-record-pager',
        role: 'group',
        'aria-label': t('pager.label'),
      },
      h('span', { className: 'dsh-record-pager-info' },
        t('pager.total', { total: String(recordsTotal) }),
        ' · ',
        t('pager.page', { page: String(recordsPage), pages: String(recordsPageCount) })),
      h('div', { className: 'dsh-record-pager-actions' },
        h('button', {
          type: 'button',
          className: 'dsh-record-small-button',
          disabled: recordsPage <= 1 || recordsStatus === 'loading',
          'aria-label': t('pager.prev'),
          onClick: () => setRecordsPage(page => Math.max(1, page - 1)),
        }, t('pager.prev')),
        h('button', {
          type: 'button',
          className: 'dsh-record-small-button',
          disabled: recordsPage >= recordsPageCount || recordsStatus === 'loading',
          'aria-label': t('pager.next'),
          onClick: () => setRecordsPage(page => Math.min(recordsPageCount, page + 1)),
        }, t('pager.next')),
        h('label', { className: 'dsh-record-pager-size' },
          h('span', null, t('pager.pageSize')),
          h(Select, {
            value: String(recordsPageSize),
            ariaLabel: t('pager.pageSize'),
            options: PAGE_SIZES.map(size => ({ value: String(size), label: t('pager.sizeOption', { count: String(size) }) })),
            onChange: (next) => {
              setRecordsPageSize(Number(next))
              setRecordsPage(1)
            },
          }))))
      const content = selectedNode === null
        ? h('section', { className: 'dsh-record-empty' },
          h('h2', null, nodes.length === 0 ? t('tree.empty') : t('tree.selectHint')),
          nodes.length === 0 ? h('p', null, t('tree.emptyBody')) : null,
          nodes.length === 0
            ? h('button', {
              type: 'button',
              className: 'dsh-record-button dsh-record-button-primary',
              onClick: () => setNodeDialog({ mode: 'create', parentId: null, target: null }),
            }, t('tree.emptyAction'))
            : null)
        : h(React.Fragment, null,
          templatesError === null ? null : h('div', { className: 'dsh-record-banner', role: 'alert' },
            h('p', null, templatesError),
            h('button', { type: 'button', className: 'dsh-record-small-button', onClick: refresh }, t('action.retry'))),
          recordsError === null ? null : h('div', { className: 'dsh-record-banner', role: 'alert' },
            h('p', null, recordsError),
            h('button', { type: 'button', className: 'dsh-record-small-button', onClick: refresh }, t('action.retry'))),
          tab === 'records'
            ? h('div', { className: 'dsh-record-records' },
              recordsToolbar,
              selectionBar,
              batchNotice === null
                ? null
                : h('div', { className: 'dsh-record-banner', role: 'alert' },
                  h('p', null, batchNotice),
                  h('button', {
                    type: 'button',
                    className: 'dsh-record-small-button',
                    onClick: () => setBatchNotice(null),
                  }, t('action.close'))),
              h('div', { className: 'dsh-record-records-scroll' }, recordsBody),
              recordsPager)
            : h(React.Fragment, null, templatesToolbar, templatesBody))
      const mainPane = h('main', { className: 'dsh-record-main' },
        h('header', { className: 'dsh-record-main-head' },
          h('div', { className: 'dsh-record-heading' },
            h('h1', {
              className: 'dsh-record-title',
              title: selectedNode === null ? undefined : selectedNode.name,
            }, selectedNode === null ? t('page.title') : selectedNode.name),
            selectedNode === null || selectedNode.description === ''
              ? null
              : h('p', { className: 'dsh-record-subtitle' }, selectedNode.description),
            h('div', { className: 'dsh-record-badges' },
              selectedNode === null
                ? null
                : h('span', { className: 'dsh-record-muted' },
                  `${t('header.templates', { count: String(templates.length) })} · `
                  + t('header.records', { count: String(typeof selectedNode.recordCount === 'number' ? selectedNode.recordCount : 0) }))))),
        selectedNode === null ? null : tabs,
        h('div', {
          className: selectedNode !== null && tab === 'records'
            ? 'dsh-record-content dsh-record-content-fill'
            : 'dsh-record-content',
        }, content))
      const retryButton = h('button', {
        key: 'retry',
        type: 'button',
        className: 'dsh-record-button dsh-record-button-primary',
        onClick: () => { setFatal(null); refresh() },
      }, t('action.retry'))
      const openDatabaseButton = typeof openDatabasePlugin !== 'function'
        ? null
        : h('button', {
          key: 'database',
          type: 'button',
          className: 'dsh-record-button',
          onClick: openDatabasePlugin,
        }, t('action.openDatabase'))
      const stateActions = openDatabaseButton === null ? [retryButton] : [retryButton, openDatabaseButton]
      if (fatal !== null) {
        return h('div', { className: 'dsh-record-page' },
          h('div', { className: 'dsh-record-state-wrap' },
            h('section', { className: 'dsh-record-state', role: 'alert' },
              h('h2', null, fatal.code === 'database-plugin-missing'
                ? t('state.databaseMissingTitle')
                : t('state.databaseDownTitle')),
              h('p', null, fatal.code === 'database-plugin-missing'
                ? t('state.databaseMissingBody')
                : t('state.databaseDownBody')),
              h('div', { className: 'dsh-record-state-actions' }, stateActions))))
      }
      if (treeStatus === 'loading' && nodes.length === 0) {
        return h('div', { className: 'dsh-record-page' },
          h('div', { className: 'dsh-record-state-wrap' },
            h('div', { style: { width: 'min(420px, 100%)' } },
              h(Skeleton, { label: t('state.loading'), rows: 4 }),
              h('p', { className: 'dsh-record-muted', role: 'status' }, t('state.loading')))))
      }
      if (treeStatus === 'error' && nodes.length === 0) {
        return h('div', { className: 'dsh-record-page' },
          h('div', { className: 'dsh-record-state-wrap' },
            h('section', { className: 'dsh-record-state', role: 'alert' },
              h('h2', null, t('state.errorTitle')),
              h('p', null, treeError === null ? t('error.generic') : treeError),
              h('div', { className: 'dsh-record-state-actions' }, stateActions))))
      }
      const splitter = h('div', {
        className: 'dsh-record-splitter',
        role: 'separator',
        'aria-orientation': 'vertical',
        'aria-label': t('splitter.label'),
        'aria-valuenow': sidebarWidth,
        'aria-valuemin': MIN_SIDEBAR_WIDTH,
        'aria-valuemax': MAX_SIDEBAR_WIDTH,
        tabIndex: 0,
        title: t('splitter.hint'),
        onPointerDown: startResize,
        onKeyDown: onSplitterKeyDown,
        onDoubleClick: () => setSidebarWidth(DEFAULT_SIDEBAR_WIDTH),
      }, h('span', { className: 'dsh-record-splitter-grip', 'aria-hidden': 'true' }))
      return h('div', { className: 'dsh-record-page' },
        h('div', {
          className: 'dsh-record-body',
          ref: bodyRef,
          'data-resizing': resizing ? 'true' : undefined,
        }, treePane, splitter, mainPane),
        nodeDialog === null ? null : h(NodeDialog, {
          key: nodeDialog.mode === 'edit' && nodeDialog.target !== null
            ? `edit:${String(nodeDialog.target.id)}`
            : `create:${String(nodeDialog.parentId)}`,
          t,
          mode: nodeDialog.mode,
          parentId: nodeDialog.parentId,
          target: nodeDialog.target,
          onClose: () => setNodeDialog(null),
          onSaved: () => { setNodeDialog(null); refresh() },
          onStorageFailure: reportStorageFailure,
        }),
        templateDialog === null ? null : h(TemplateDialog, {
          key: templateDialog.mode === 'edit' && templateDialog.template !== null
            ? `edit:${String(templateDialog.template.id)}`
            : 'create-template',
          t,
          mode: templateDialog.mode,
          template: templateDialog.template,
          nodeId: selectedId,
          onClose: () => setTemplateDialog(null),
          onSaved: () => { setTemplateDialog(null); refresh() },
          onStorageFailure: reportStorageFailure,
        }),
        recordDialog === null ? null : h(RecordDialog, {
          key: recordDialog.mode === 'edit' && recordDialog.record !== null
            ? `edit:${String(recordDialog.record.id)}`
            : 'create-record',
          t,
          mode: recordDialog.mode,
          record: recordDialog.record,
          nodeId: selectedId,
          templates,
          onClose: () => setRecordDialog(null),
          onSaved: () => { setRecordDialog(null); refresh() },
          onStorageFailure: reportStorageFailure,
        }),
        detail === null ? null : h(RecordDetailDialog, {
          t,
          record: detail,
          template: detailsTemplate,
          onClose: () => setDetail(null),
        }),
        batchConfirm ? h(ConfirmDialog, {
          t,
          title: t('records.batchDeleteTitle'),
          body: t('records.batchDeleteBody', { count: String(selectedRecordIds.length) }),
          busy: batchBusy,
          error: batchError,
          onCancel: () => { if (!batchBusy) { setBatchConfirm(false); setBatchError(null) } },
          onConfirm: () => { void deleteSelectedRecords() },
        }) : null,
        deleteTarget === null ? null : h(ConfirmDialog, {
          t,
          title: deleteTarget.kind === 'node'
            ? t('node.deleteTitle')
            : deleteTarget.kind === 'template'
              ? t('templates.deleteTitle')
              : t('record.deleteTitle'),
          body: deleteTarget.kind === 'node'
            ? t('node.deleteBody', { name: deleteTarget.name })
            : deleteTarget.kind === 'template'
              ? t('templates.deleteBody', { name: deleteTarget.name })
              : t('record.deleteBody', { name: deleteTarget.name }),
          busy: deleteBusy,
          error: deleteError,
          onCancel: () => { if (!deleteBusy) setDeleteTarget(null) },
          onConfirm: () => { void confirmDelete() },
        }))
    }

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, COPY), 'dsh-record: dictionaries')
      const t = ctx.locale.bind(NS)
      ctx.effect(() => installStyle(), 'dsh-record: styles')
      const openDatabasePlugin = () => {
        const navigation = ctx.get('pluginNavigation')
        if (navigation === undefined || navigation === null) return
        if (typeof navigation.openBundle === 'function') navigation.openBundle(DATABASE_BUNDLE)
        else if (typeof navigation.openList === 'function') navigation.openList()
      }
      ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: 40,
        locale: NS,
        label: () => t('panel'),
      }, PanelIcon))
      ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main',
        key: PANEL_ID,
        locale: NS,
        inject: () => ({ openDatabasePlugin }),
      }, AlertRecordsPage))
    }

    return { inject: ['slots', 'locale'], apply }
  },
})
