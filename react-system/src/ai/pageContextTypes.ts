/**
 * AI 助手 · 第二档「知道你在看什么」页面级上下文
 *
 * 由具体页面（本期仅「工匠查询」）在挂载时注册，描述「当前页面的可公开状态」：
 * 生效筛选、结果总数、分页、可见列名。基础位置信息（应用/域/用户/路由/菜单）
 * 由传输层统一注入到 extra.base，页面侧只写 extra.page，不得覆盖 extra.base。
 *
 * 白名单边界（重要）：
 * - 只输出筛选字段名/操作符/值、总数、分页、列名；
 * - 绝不输出任何行数据（记录内容、字段值、ID 列表）；
 * - 筛选值若呈手机号/邮箱形态则省略值（只留字段名），超长文本按 60 字截断。
 */
export type PageContextType = 'list' | 'detail' | 'form'

/** 页面字段定义的最小投影（key → 中文名 → 筛选项类型） */
export interface PageFieldDef {
  key: string
  label: string
  type?: string
}

/** 单条生效筛选（值可能被省略，见 valueOmitted） */
export interface PageFilterContext {
  /** 字段 key（如 name） */
  key: string
  /** 字段中文名（如 姓名） */
  label: string
  /** 操作符：contains / eq / range（由字段类型推断） */
  op: string
  /** 脱敏后的筛选值；valueOmitted=true 时缺省 */
  value?: string
  /** 值因疑似敏感（手机号/邮箱）被省略 */
  valueOmitted?: boolean
}

/** 列表页上下文（与后端 AiContextPromptBuilder 的 page.list 契约对齐） */
export interface ListPageContext {
  type: 'list'
  list: {
    /** 当前生效筛选（空值不输出，最多 8 条） */
    filters: PageFilterContext[]
    /** 结果总数 */
    total: number
    /** 当前页码（从 1 开始） */
    pageNo: number
    pageSize: number
    /** 可见列中文名（去重，最多 8 个） */
    columns: string[]
  }
}

/** 详情页上下文（预留，本期不接入） */
export interface DetailPageContext {
  type: 'detail'
  record: {
    /** 主键/关键字段名（不含值） */
    keyFields: Pick<PageFieldDef, 'key' | 'label'>[]
  }
}

/** 表单页上下文（预留，本期不接入） */
export interface FormPageContext {
  type: 'form'
  form: {
    /** create / edit */
    mode?: string
    dirty?: boolean
    /** 缺失的必填字段名（不含值） */
    missingRequired?: string[]
  }
}

export type PageContext = ListPageContext | DetailPageContext | FormPageContext

export interface BuildListPageContextParams {
  /** 当前筛选条件（来自列表 hook 的 filterParams） */
  filterParams: Record<string, unknown>
  /** 页面筛选项定义，用于把 key 映射为中文名与操作符 */
  fieldDefs: PageFieldDef[]
  total: number
  pageNo: number
  pageSize: number
  /** 当前可见列的中文名（由页面按列设置计算） */
  visibleColumnLabels: string[]
}

const MAX_FILTERS = 8
const MAX_COLUMNS = 8
const MAX_VALUE_CHARS = 60
/** 手机号/长数字串形态（7 位以上纯数字） */
const PHONE_LIKE = /^\d{7,}$/
const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

function toText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join('、')
  }
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

/** 由筛选项类型推断操作符：文本类按包含，其余按精确匹配 */
function resolveOp(type?: string): string {
  if (type === 'input') return 'contains'
  if (type === 'daterange') return 'range'
  return 'eq'
}

function truncate(text: string, limit: number): string {
  return text.length > limit ? `${text.slice(0, limit)}…` : text
}

/**
 * 构造列表页上下文（纯函数，便于单测）。
 * 只读筛选/分页/列名，不接触 dataSource，天然隔离行数据。
 */
export function buildListPageContext(params: BuildListPageContextParams): ListPageContext {
  const defByKey = new Map(params.fieldDefs.map((def) => [def.key, def]))
  const filters: PageFilterContext[] = []

  Object.entries(params.filterParams ?? {}).forEach(([key, raw]) => {
    if (isEmptyValue(raw)) return
    if (filters.length >= MAX_FILTERS) return
    const def = defByKey.get(key)
    const text = toText(raw)
    if (!text) return
    const base = { key, label: def?.label ?? key, op: resolveOp(def?.type) }
    if (PHONE_LIKE.test(text.replace(/[\s-]/g, '')) || EMAIL_LIKE.test(text)) {
      filters.push({ ...base, valueOmitted: true })
      return
    }
    filters.push({ ...base, value: truncate(text, MAX_VALUE_CHARS) })
  })

  const columns: string[] = []
  for (const label of params.visibleColumnLabels) {
    const name = label?.trim()
    if (!name || columns.includes(name)) continue
    columns.push(name)
    if (columns.length >= MAX_COLUMNS) break
  }

  return {
    type: 'list',
    list: {
      filters,
      total: Number.isFinite(params.total) ? params.total : 0,
      pageNo: Number.isFinite(params.pageNo) ? params.pageNo : 1,
      pageSize: Number.isFinite(params.pageSize) ? params.pageSize : 0,
      columns,
    },
  }
}
