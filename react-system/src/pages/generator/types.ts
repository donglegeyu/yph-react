export type FieldType = 'input' | 'select' | 'select-multi' | 'radio' | 'cascader' | 'date' | 'daterange' | 'number' | 'status'

export type ActionType = 'detail' | 'edit' | 'delete' | 'custom'

export type MenuLinkMode = 'new_child' | 'bind_existing'

export type FixedSide = 'left' | 'right' | null

export type StatusColor = 'success' | 'warning' | 'error' | 'processing' | 'default'

export interface SelectOption {
  label: string
  value: string | number
}

export interface StatusMapItem {
  value: string
  text: string
  color: StatusColor
}

export interface FieldConfig {
  fieldKey: string
  fieldLabel: string
  fieldType: FieldType
  width: number
  fixed: FixedSide
  isFilter: boolean
  sortable: boolean
  options: SelectOption[]
  isStatusTag: boolean
  statusMap: StatusMapItem[]
  isAction: boolean
  dbColumn: string
  dbType: string
  dbLength: number
  componentPropsJson: string
  sortOrder: number
  dataSource?: FieldDataSource | null
  dataSourceCacheTtl?: number
  // 表单页字段所属分组 id（对应 formConfig.fieldGroups，留空平铺在未分组区）
  groupId?: string
  /** @deprecated 旧版分组字段名，加载/渲染时由 normalizeFormFieldGroups 迁移为 groupId */
  groupName?: string
}

// 表单页字段分组（一等结构）：先建组，字段通过 groupId 加入组；渲染时未分组字段平铺在前，组按数组顺序
export interface FormFieldGroupConfig {
  id: string
  name: string
}

let formGroupSeq = 0
export function createFormFieldGroupId(): string {
  formGroupSeq += 1
  return `fg_${Date.now().toString(36)}_${formGroupSeq}_${Math.random().toString(36).slice(2, 6)}`
}

// 字段数据源类型族
export type FieldDataSourceKind = 'static' | 'tableRef' | 'api' | 'dict'

export interface StaticDataSource {
  kind: 'static'
  options: SelectOption[]
}

export interface TableRefDataSource {
  kind: 'tableRef'
  table: string
  labelKey: string
  valueKey: string
  filterExpr?: string
  apiPath?: string
  cascadeFrom?: string
}

export interface ApiDataSource {
  kind: 'api'
  apiPath: string
  labelKey: string
  valueKey: string
  params?: Record<string, string>
}

export interface DictDataSource {
  kind: 'dict'
  dictKey: string
}

export type FieldDataSource =
  | StaticDataSource
  | TableRefDataSource
  | ApiDataSource
  | DictDataSource

export const DATA_SOURCE_KIND_OPTIONS: { label: string; value: FieldDataSourceKind }[] = [
  { label: '静态选项', value: 'static' },
  { label: '关联表', value: 'tableRef' },
  { label: '自定义 API', value: 'api' },
  { label: '字典', value: 'dict' },
]

export interface ActionConfig {
  actionKey: string
  actionLabel: string
  actionType: ActionType
  needConfirm: boolean
  conditionExpr: string
  sortOrder: number
}

// toolbar 按钮类型：主按钮（primary）/ 次按钮（default）
// 密度、列设置由 SmartListTemplate 自带，不需配置
export type ToolbarButtonType = 'primary' | 'default'

export interface ToolbarButtonConfig {
  btnKey: string
  btnLabel: string
  btnType: ToolbarButtonType
  // custom 类型可填 onClick 触发的提示文案，便于演示
  tooltip?: string
  sortOrder: number
}

export interface TreeConfig {
  enabled: boolean
  expandColumnKey: string
  childrenColumnName: string
  levelIndent: number
}

// 详情页头部标签项（对应 DetailPageTemplate 的 tags）
export type DetailTagVariant = 'default' | 'volcano' | 'success' | 'warning'

export interface DetailTagConfig {
  tagKey: string
  tagText: string
  variant: DetailTagVariant
  sortOrder: number
}

// 详情页 Tab 内容类型
export type DetailTabContentType = 'fields' | 'subtable' | 'timeline'

// 关联子表的列配置
export interface SubTableColumnConfig {
  colKey: string
  colLabel: string
  sortOrder: number
}

// 时间轴/日志的条目配置
export interface TimelineItemConfig {
  time: string
  content: string
  sortOrder: number
}

// 详情页 Tab 字段分组（一个 Tab 下可含多个分组，每组一个标题+字段集合）
export interface DetailFieldGroupConfig {
  groupKey: string
  groupLabel: string
  fieldKeys: string[]
  sortOrder: number
}

// 详情页 Tab 项（对应 DetailPageTemplate 的 tabs）
export interface DetailTabConfig {
  tabKey: string
  tabLabel: string
  sortOrder: number
  // Tab 内容类型：字段网格 / 关联子表 / 时间轴日志
  contentType: DetailTabContentType
  // contentType='fields' 扁平模式：选择展示的字段 key 列表（空则展示全部字段）
  fieldKeys: string[]
  // contentType='fields' 时：字段分组配置（详情页支持分组展示，表单页固定扁平）
  fieldGroups: DetailFieldGroupConfig[]
  // contentType='fields' 时：列数
  fieldColumns: number
  // contentType='subtable' 时：子表列配置
  subTableColumns: SubTableColumnConfig[]
  // contentType='subtable' 时：子表标题
  subTableTitle: string
  // contentType='timeline' 时：日志条目配置（运行时从接口取，配置时给示例）
  timelineItems: TimelineItemConfig[]
}

// 详情页头部配置（对应 DetailPageTemplate 的 dpt-info-top 区域 + tabs + titleActions）
export interface DetailHeaderConfig {
  // 主名称：从已有字段中选一个作为大标题展示，空则不显示 primaryName
  primaryNameFieldKey: string
  // 是否显示头像（用 primaryName 首字母作为头像内容）
  showAvatar: boolean
  tags: DetailTagConfig[]
  // 正文 Tab 列表（详情/权限/记录 等多区域切换），空则用 children 单区域
  tabs: DetailTabConfig[]
  // 标题栏右侧操作按钮（如"编辑"），复用 toolbarButtons 配置
  titleActions: ToolbarButtonConfig[]
}

// 表单页底部按钮配置（action 决定点击行为：submit 提交后返回上一页 / save 保存后留在当前页 / cancel 返回上一页；btnType 随 action 派生：submit→primary / 其他→default）
export interface FormFooterButtonConfig {
  btnKey: string
  btnLabel: string
  btnType: 'primary' | 'default'
  action: 'submit' | 'save' | 'cancel'
  sortOrder: number
}

// 表单页模板配置（footerButtons 为空数组时不渲染底部操作区）
export interface FormPageConfig {
  // 底部按钮列表（默认 取消/确定 2 个，可增删改）
  footerButtons: FormFooterButtonConfig[]
  // 表单页字段分组（有序）：字段通过 FieldConfig.groupId 归属，未入组字段平铺在前
  fieldGroups?: FormFieldGroupConfig[]
}

export interface GroupedConfigLike {
  fields: FieldConfig[]
  formConfig?: FormPageConfig
}

// 将旧 groupName 数据迁移为一等分组结构（formConfig.fieldGroups + field.groupId）；无迁移需求时原对象返回
export function normalizeFormFieldGroups<T extends GroupedConfigLike>(config: T): T {
  const groups = config.formConfig?.fieldGroups ?? []
  const fields = config.fields
  const hasLegacy = fields.some((f) => !f.groupId && (f.groupName ?? '').trim())
  const needFix = hasLegacy || groups.some((g) => !g.id)
  if (!needFix) return config
  const nextGroups: FormFieldGroupConfig[] = groups.map((g) => ({
    ...g,
    id: g.id || createFormFieldGroupId(),
    name: (g.name || '').trim(),
  }))
  const idByName = new Map(nextGroups.filter((g) => g.name).map((g) => [g.name, g.id]))
  const nextFields = fields.map((f) => {
    const name = (f.groupName ?? '').trim()
    if (!f.groupId && name) {
      let gid = idByName.get(name)
      if (!gid) {
        gid = createFormFieldGroupId()
        nextGroups.push({ id: gid, name })
        idByName.set(name, gid)
      }
      return { ...f, groupId: gid, groupName: undefined }
    }
    return f.groupName !== undefined ? { ...f, groupName: undefined } : f
  })
  return {
    ...config,
    formConfig: { ...(config.formConfig ?? createEmptyFormPage()), fieldGroups: nextGroups },
    fields: nextFields,
  }
}

export function createEmptyFormFieldGroup(): FormFieldGroupConfig {
  return { id: createFormFieldGroupId(), name: '' }
}

export interface PageDefinitionDTO {
  id: string
  pageKey: string
  pageName: string
  templateType: string
  tableName: string
  isNewTable: boolean
  apiPrefix: string
  generateMenu: boolean
  menuLinkMode: MenuLinkMode
  parentMenuId: string | null
  bindMenuId: string | null
  // 详情页关联的列表页 pageKey（仅 templateType='detail' 时使用）
  sourceListPageKey: string
  // 详情页头部配置（仅 templateType='detail' 时使用）
  detailHeader: DetailHeaderConfig
  // 表单页模板配置（仅 templateType='form' 时使用）
  formConfig: FormPageConfig
  treeConfig: TreeConfig
  fields: FieldConfig[]
  actions: ActionConfig[]
  toolbarButtons: ToolbarButtonConfig[]
  status: 'draft' | 'published'
  /** 数据表迁移状态：not_generated-未生成 pending-待入库 ready-已就绪 */
  migrationStatus?: string
  createdBy: string
  updatedBy: string
  createdTime: string
  updatedTime: string
}

export interface PageSchemaVO {
  pageKey: string
  pageName: string
  tableName: string
  apiPrefix: string
  templateType?: string
  treeConfig: TreeConfig
  fields: FieldConfig[]
  actions: ActionConfig[]
  toolbarButtons: ToolbarButtonConfig[]
  sourceListPageKey?: string
  generateMenu?: boolean
  detailHeader?: DetailHeaderConfig
  formConfig?: FormPageConfig
}

const FIELD_TYPE_OPTIONS: SelectOption[] = [
  { label: '文本输入', value: 'input' },
  { label: '下拉选择', value: 'select' },
  { label: '下拉多选', value: 'select-multi' },
  { label: '单选', value: 'radio' },
  { label: '级联选择', value: 'cascader' },
  { label: '日期', value: 'date' },
  { label: '日期范围', value: 'daterange' },
  { label: '数字', value: 'number' },
  { label: '状态标签', value: 'status' },
]

const ACTION_TYPE_OPTIONS: SelectOption[] = [
  { label: '详情', value: 'detail' },
  { label: '编辑', value: 'edit' },
  { label: '删除', value: 'delete' },
  { label: '自定义', value: 'custom' },
]

const STATUS_COLOR_OPTIONS: SelectOption[] = [
  { label: '成功(绿)', value: 'success' },
  { label: '警告(黄)', value: 'warning' },
  { label: '错误(红)', value: 'error' },
  { label: '处理中(蓝)', value: 'processing' },
  { label: '默认(灰)', value: 'default' },
]

const DB_TYPE_OPTIONS: SelectOption[] = [
  { label: 'VARCHAR', value: 'VARCHAR' },
  { label: 'TEXT', value: 'TEXT' },
  { label: 'INT', value: 'INT' },
  { label: 'BIGINT', value: 'BIGINT' },
  { label: 'DECIMAL', value: 'DECIMAL' },
  { label: 'DATETIME', value: 'DATETIME' },
  { label: 'DATE', value: 'DATE' },
]

export {
  FIELD_TYPE_OPTIONS,
  ACTION_TYPE_OPTIONS,
  STATUS_COLOR_OPTIONS,
  DB_TYPE_OPTIONS,
}

export function createEmptyField(sortOrder: number): FieldConfig {
  return {
    fieldKey: '',
    fieldLabel: '',
    fieldType: 'input',
    width: 120,
    fixed: null,
    isFilter: true,
    sortable: true,
    options: [],
    isStatusTag: false,
    statusMap: [],
    isAction: false,
    dbColumn: '',
    dbType: 'VARCHAR',
    dbLength: 255,
    componentPropsJson: '',
    sortOrder,
    dataSource: null,
    dataSourceCacheTtl: 300,
  }
}

export function createEmptyAction(sortOrder: number): ActionConfig {
  return {
    actionKey: '',
    actionLabel: '',
    actionType: 'custom',
    needConfirm: false,
    conditionExpr: '',
    sortOrder,
  }
}

export function createEmptyToolbarButton(sortOrder: number): ToolbarButtonConfig {
  return {
    btnKey: '',
    btnLabel: '',
    btnType: 'default',
    tooltip: '',
    sortOrder,
  }
}

export function createEmptyDetailTag(sortOrder: number): DetailTagConfig {
  return {
    tagKey: '',
    tagText: '',
    variant: 'default',
    sortOrder,
  }
}

export function createEmptyFieldGroup(sortOrder: number): DetailFieldGroupConfig {
  return {
    groupKey: '',
    groupLabel: '',
    fieldKeys: [],
    sortOrder,
  }
}

export function createEmptyDetailTab(sortOrder: number): DetailTabConfig {
  return {
    tabKey: '',
    tabLabel: '',
    sortOrder,
    contentType: 'fields',
    fieldKeys: [],
    fieldGroups: [],
    fieldColumns: 2,
    subTableColumns: [],
    subTableTitle: '',
    timelineItems: [],
  }
}

export function createEmptyDetailHeader(): DetailHeaderConfig {
  return {
    primaryNameFieldKey: '',
    showAvatar: false,
    tags: [],
    tabs: [],
    titleActions: [],
  }
}

export function createEmptyFooterButton(sortOrder: number): FormFooterButtonConfig {
  return {
    btnKey: '',
    btnLabel: '',
    btnType: 'primary',
    action: 'submit',
    sortOrder,
  }
}

export function createEmptyFormPage(): FormPageConfig {
  return {
    // 默认 2 个按钮：保存（保存表单，成功后留在当前页）在前、取消（返回上一页）在后
    footerButtons: [
      { btnKey: 'btn-save', btnLabel: '保存', btnType: 'primary', action: 'save', sortOrder: 0 },
      { btnKey: 'btn-cancel', btnLabel: '取消', btnType: 'default', action: 'cancel', sortOrder: 1 },
    ],
  }
}

export function createEmptyPage(): PageDefinitionDTO {
  const now = new Date().toISOString()
  return {
    id: '',
    pageKey: '',
    pageName: '',
    templateType: 'list_basic',
    tableName: '',
    isNewTable: true,
    apiPrefix: '',
    generateMenu: true,
    menuLinkMode: 'new_child',
    parentMenuId: null,
    bindMenuId: null,
    sourceListPageKey: '',
    detailHeader: createEmptyDetailHeader(),
    formConfig: createEmptyFormPage(),
    treeConfig: {
      enabled: false,
      expandColumnKey: 'name',
      childrenColumnName: 'children',
      levelIndent: 24,
    },
    fields: [],
    actions: [],
    toolbarButtons: [
      {
        btnKey: '',
        btnLabel: '新增',
        btnType: 'primary',
        sortOrder: 0,
      },
    ],
    status: 'draft',
    createdBy: '',
    updatedBy: '',
    createdTime: now,
    updatedTime: now,
  }
}

export function toSnakeCase(input: string): string {
  if (!input) return ''
  return input
    .replace(/([A-Z])/g, '_$1')
    .replace(/[\s\-]+/g, '_')
    .toLowerCase()
    .replace(/^_+|_+$/g, '')
}

export function toKebabCase(input: string): string {
  if (!input) return ''
  return input
    .replace(/([A-Z])/g, '-$1')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
    .replace(/^-+|-+$/g, '')
}

export function toPascalCase(input: string): string {
  if (!input) return ''
  const parts = input.replace(/[-_\s]+/g, ' ').split(' ')
  return parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join('')
}
