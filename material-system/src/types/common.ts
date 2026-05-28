import type { Component } from 'vue'

export interface SelectOption {
  label: string
  value: string | number
}

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

export interface Favorite {
  menuKey: string
  menuLabel: string
  menuPath?: string
  sort?: number
}

export interface CustomNavMenu extends MenuItem {
  menuType?: string
}

export interface NavMenu extends MenuItem {
  menuType?: string
  children?: NavMenu[]
}

export interface FilterOption {
  key: string
  label: string
  checked: boolean
  options?: SelectOption[]
  defaultValue?: unknown
  type?: 'input' | 'select' | 'date' | 'daterange'
  placeholder?: string
}

export interface FilterItem {
  key: string
  label: string
  type: 'input' | 'select' | 'date' | 'daterange' | 'button' | 'item'
  placeholder?: string
  options?: SelectOption[]
  inputType?: string
  shortcuts?: Array<{ text: string; value: [string, string] }>
}

export interface FilterScheme {
  id: string
  name: string
  filters: Record<string, unknown>
  filterOrder?: string[]
  createdAt: string
  userId: string
}

export interface TableColumn {
  title: string
  dataIndex: string
  key: string
  width?: number
  fixed?: 'left' | 'right'
}

export interface PaginationConfig {
  current: number
  pageSize: number
  total: number
}

export interface FieldDefinition {
  key: string
  label: string
  type?: 'input' | 'select' | 'date' | 'daterange' | 'item'
  placeholder?: string
  options?: SelectOption[]
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

export interface DisplayItem {
  key: string
  label?: string
  type?: string
  inputType?: string
  placeholder?: string
  options?: SelectOption[]
}

export interface RecordType {
  [key: string]: unknown
}

export type ComponentType = Component | (() => Promise<Component>)

export interface MenuPathInfo {
  path: string
  key: string
  label: string
}
