// API 基础路径（通过 Vite 代理转发到后端 8081）
// 注意：store/app.ts 中的菜单/收藏/偏好等接口使用原生 fetch（不走 axios baseURL），
// 因此 API_ENDPOINTS 必须包含完整的 /api 前缀。
export const API_BASE = '/api'

// 后端服务 API（完整路径，原生 fetch 与 axios 均可直接使用）
export const API_ENDPOINTS = {
  // 认证
  AUTH_LOGIN: `${API_BASE}/auth/login`,

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

  // 用户管理
  SYS_USERS: `${API_BASE}/sys/users`,

  // 部门管理
  SYS_DEPTS: `${API_BASE}/sys/depts`,

  // 角色管理
  SYS_ROLES: `${API_BASE}/sys/roles`,

  // 技能管理
  SKILLS: `${API_BASE}/skills`,

  // 证件类型图片库
  CERTIFICATE_IMAGES: `${API_BASE}/certificate-images`,

  // 证件类型字典
  CERTIFICATE_TYPES: `${API_BASE}/certificate-types`,

  // 文件上传
  FILE_UPLOAD: `${API_BASE}/files/upload`,

  // 服务商列表（后端就绪后替换 mock）
  SERVICE_PROVIDERS: `${API_BASE}/service-providers`,
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
