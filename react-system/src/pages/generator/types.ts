export type FieldType = 'input' | 'select' | 'select-multi' | 'radio' | 'cascader' | 'date' | 'daterange' | 'number'

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

export interface TreeConfig {
  enabled: boolean
  expandColumnKey: string
  childrenColumnName: string
  levelIndent: number
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
  treeConfig: TreeConfig
  fields: FieldConfig[]
  actions: ActionConfig[]
  status: 'draft' | 'published'
  createdBy: string
  createdTime: string
  updatedTime: string
}

export interface PageSchemaVO {
  pageKey: string
  pageName: string
  tableName: string
  apiPrefix: string
  treeConfig: TreeConfig
  fields: FieldConfig[]
  actions: ActionConfig[]
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
    sortable: false,
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
    treeConfig: {
      enabled: false,
      expandColumnKey: 'name',
      childrenColumnName: 'children',
      levelIndent: 24,
    },
    fields: [],
    actions: [],
    status: 'draft',
    createdBy: '',
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
