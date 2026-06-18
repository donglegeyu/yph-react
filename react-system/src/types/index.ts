// ========== 菜单相关 ==========
export interface MenuItem {
  key: string
  label: string
  path?: string
  icon?: string
  children?: MenuItem[]
  hasChildren?: boolean
  menuType?: string
  status?: number
}

export interface BusinessMenu extends MenuItem {
  hasChildren: boolean
  children: MenuItem[]
}

export interface NavMenu {
  id?: number
  key: string
  label: string
  path?: string
  component?: string
  perms?: string
  visible?: number
  menuCategory?: string
  icon?: string
  sort?: number
  status?: number
  parentId?: number
  level?: number
  menuType?: string
  children?: NavMenu[]
  hasChildren?: boolean
}

// ========== 收藏相关 ==========
export interface Favorite {
  menuKey: string
  menuLabel: string
  menuPath?: string
  sort?: number
}

// ========== 自定义导航 ==========
export interface CustomNavMenu {
  key: string
  label: string
  path?: string
  icon?: string
  [key: string]: unknown
}

// ========== 用户相关 ==========
export interface UserInfo {
  id?: number
  username?: string
  nickname?: string
  realName?: string
  avatar?: string
  role?: string
}

export interface LoginResult {
  token: string
  id: number
  username: string
  nickname?: string
  realName?: string
  deptId?: number
  deptName?: string
  phone?: string
  email?: string
}

// ========== 域相关 ==========
export interface Domain {
  id: number
  domainName: string
}

// ========== 标签页 ==========
export interface AppTab {
  key: string
  title: string
  path: string
}

// ========== 表格/列表相关 ==========
export interface PaginationConfig {
  current: number
  pageSize: number
  total: number
}

export interface ColumnField {
  key: string
  label: string
  visible: boolean
  width?: number
  fixed?: 'left' | 'right'
  [key: string]: unknown
}

// ========== 筛选视图 ==========
export interface FilterScheme {
  id: string
  name: string
  filters?: Record<string, unknown>
  filterOrder?: string[]
  userId?: string
  createdAt?: string
}

export interface FilterOption {
  key: string
  label: string
  type?: string
  options?: { label: string; value: unknown }[]
}

export interface FilterItem {
  key: string
  label: string
  type: string
  placeholder?: string
  options?: { label: string; value: unknown }[]
}

export interface DisplayItem {
  key: string
  label?: string
  type: 'item' | 'button'
  inputType?: string
  placeholder?: string
  options?: { label: string; value: unknown }[]
}

export interface FieldDefinition {
  key: string
  label: string
  type?: 'input' | 'select' | 'date' | 'daterange' | 'item'
  placeholder?: string
  options?: { label: string; value: string | number }[]
  width?: number
  fixed?: 'left' | 'right'
}

export interface TreeConfig {
  enabled: boolean
  expandColumnKey?: string
  levelField?: string
  hasChildrenField?: string
  levelIndent?: number
  bodyCellSlot?: string
}

// ========== API 响应 ==========
export interface ApiResponse<T = unknown> {
  code: number
  message?: string
  data: T
  total?: number
}

export interface PaginatedData<T> {
  records: T[]
  total: number
  current?: number
  size?: number
}

// ========== 主题 ==========
export type ThemeMode = 'light' | 'dark'

// ========== 状态码 ==========
export const STATUS_CODES = {
  MATERIAL_PENDING: 'pending',
  MATERIAL_APPROVED: 'approved',
  MATERIAL_REJECTED: 'rejected',
  MENU_ENABLED: 1,
  MENU_DISABLED: 0,
} as const
