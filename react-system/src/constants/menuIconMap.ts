/**
 * 菜单图标名 → SVG sprite symbol id 的统一映射。
 *
 * 背景：nav_menu.icon 存的是 antd 风格图标名（如 apartment、clipboard），
 * 而项目图标库是 /iconpark/sprite_nav.svg 中的 symbol id（如 building-one、table）。
 * 两侧命名不一致，需要这张映射表翻译；未命中的名字会原样透传给 <use href>，
 * sprite 里没有对应 symbol 时图标渲染为空白。
 *
 * ⚠️ 新增菜单 SQL 配图标时，务必先来这里确认映射存在（或直接用 sprite 已有 id）。
 * 历史教训：V38 用了 apartment 但映射表没有，导致二级菜单图标空白。
 */

/** sprite 中实际存在的 symbol id 集合（构建时静态，无需运行时请求） */
export const MENU_ICON_MAP: Record<string, string> = {
  // —— antd 风格名 → sprite id ——
  apartment: 'building-one',
  bell: 'comments',
  alert: 'comments',
  app: 'all-application',
  award: 'bookmark',
  barcode: 'scan-setting',
  book: 'doc-search',
  buy: 'buy',
  checkCircle: 'list',
  'check-circle': 'list',
  checkSquare: 'list',
  'check-square': 'list',
  clipboard: 'table',
  commodity: 'commodity',
  edit: 'edit',
  file: 'file-cabinet',
  fileApplication: 'doc-search',
  'file-application': 'doc-search',
  fileText: 'file-cabinet',
  'file-text': 'file-cabinet',
  goods: 'tag',
  home: 'home',
  infoCircle: 'comments',
  'info-circle': 'comments',
  layers: 'category-management',
  link: 'database-config',
  list: 'list',
  package: 'box',
  phone: 'comments',
  questionCircle: 'list',
  'question-circle': 'list',
  read: 'bookmark',
  rule: 'config',
  safe: 'message-security',
  schedule: 'schedule',
  search: 'doc-search',
  searchUser: 'user-positioning',
  'search-user': 'user-positioning',
  setting: 'setting',
  shopping: 'shopping-cart-del',
  star: 'star',
  team: 'people-top-card',
  tool: 'setting',
  transaction: 'transaction',
  user: 'people-top-card',
  warning: 'comments',
  workOrder: 'order',
  'work-order': 'order',
  wrench: 'setting',
}

/** 默认兜底图标 */
export const DEFAULT_MENU_ICON = 'id-card-v-klbe0a04'

/** 数据库图标名 → sprite symbol id；未命中原样返回，兜底见 DEFAULT_MENU_ICON */
export function getMenuIconName(icon?: string): string {
  return icon ? MENU_ICON_MAP[icon] || icon : DEFAULT_MENU_ICON
}
