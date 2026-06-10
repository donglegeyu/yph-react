// API 基础路径（通过 Vite 代理）
export const API_BASE = '/api'

// 后端服务 API
export const API_ENDPOINTS = {
  // 材料管理
  MATERIALS: `${API_BASE}/materials`,
  MATERIAL_VIEWS: `${API_BASE}/material-views`,

  // 导航菜单
  NAV_MENUS: `${API_BASE}/nav-menus`,
  NAV_MENUS_BATCH: `${API_BASE}/nav-menus/batch`,
  NAV_MENUS_BATCH_STATUS: `${API_BASE}/nav-menus/batch-status`,
  CUSTOM_NAV_MENUS: `${API_BASE}/custom-nav-menus`,

  // 收藏与视图
  FAVORITES: `${API_BASE}/favorites`,
  FAVORITES_MENU: `${API_BASE}/favorites/menu`,
  FAVORITES_SORT: `${API_BASE}/favorites/sort`,
  MENU_VIEWS: `${API_BASE}/menu-views`,

  // 用户偏好
  USER_PREFERENCES: `${API_BASE}/user-preferences`,

  // 采购订单
  PURCHASE_ORDERS: `${API_BASE}/purchase-orders`,

  // 标签
  TAGS: `${API_BASE}/tags`,

  // 施工申请
  CONSTRUCTION_APPLICATIONS: `${API_BASE}/construction-applications`,
  CONSTRUCTION_VIEWS: `${API_BASE}/construction-views`,

  // 工匠查询
  CRAFTSMEN: `${API_BASE}/craftsmen`,
  CRAFTSMAN_VIEWS: `${API_BASE}/craftsman-views`,

  // 安检结果查询
  SECURITY_CHECKS: `${API_BASE}/security-checks`,

  // 域管理
  DOMAINS: `${API_BASE}/sys/domains`,
  DOMAIN_MENUS: `${API_BASE}/sys/domain-menus`,
  DOMAIN_MENUS_BATCH: `${API_BASE}/sys/domain-menus/batch`,
  DATA_PERMISSIONS: `${API_BASE}/sys/data-permissions`,
  DATA_PERMISSIONS_BATCH: `${API_BASE}/sys/data-permissions/batch`,
} as const

// 图标服务 API
export const ICON_API = {
  BASE: '/api/icons',
} as const

// API 响应状态码
export const API_CODES = {
  SUCCESS: 200,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
  UNAUTHORIZED: 401,
} as const
