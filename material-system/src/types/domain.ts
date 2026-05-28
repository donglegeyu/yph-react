export interface Domain {
  id?: number
  domainKey: string
  domainName: string
  description?: string
  status: number
}

export interface SystemMenu {
  id: number
  label: string
  level: number
  icon?: string
  children?: SystemMenu[]
}

export interface DomainMenu {
  id?: number
  domainId: number
  menuId: number
  customLabel: string
  sort: number
  originalLabel?: string
  status?: number
  parentId?: number
  menuLevel?: number
  icon?: string
}

export interface DataPermission {
  id?: number
  domainId: number
  menuKey: number | string
  filterType: 'all' | 'self' | 'custom'
  filterField: string
  filterValue?: string
}

export interface DomainFormData {
  domainKey: string
  domainName: string
  description: string
  status: number
  isDefault?: number
}

export interface MenuWithLevel extends SystemMenu {
  level: number
  showChildren?: boolean
  isExpandable?: boolean
}
