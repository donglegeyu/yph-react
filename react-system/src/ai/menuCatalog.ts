/**
 * AI 导航 · 菜单目录与本地匹配器
 *
 * 职责：
 * 1. 从 zustand 菜单状态构建「当前用户当前域可访问」的可导航菜单目录
 *    （fetchMenus 已带 userId 请求，后端按权限过滤，因此 store 里的菜单即可访问集合）
 * 2. 把模型/用户给出的自然语言菜单名（如「任务列表」）匹配到具体菜单条目
 * 3. 匹配不到时，再拉取当前域全量菜单（不带 userId）区分「无权限」和「不存在」
 *
 * 只依赖前端已有接口，不改后端、不改数据库。
 */
import { API_ENDPOINTS } from '@/constants/api'
import { useAppStore } from '@/store/app'
import type { NavMenu } from '@/types'

export interface MenuCatalogEntry {
  /** 菜单 key（openTab 与页签隔离用） */
  key: string
  label: string
  path: string
  /** 上级菜单名（一级菜单或分组名），用于提示与候选展示 */
  parentLabel?: string
}

export interface MenuGroupNode {
  /** 分组 key */
  key: string
  label: string
  /** 子节点（全部都是 MenuCatalogEntry，都带 path） */
  children: MenuCatalogEntry[]
  /** 上级分组（可选，二级分组嵌套时） */
  parentLabel?: string
}

export type MenuResolution =
  | { status: 'unique'; entry: MenuCatalogEntry }
  | { status: 'ambiguous'; candidates: MenuCatalogEntry[] }
  /** 命中无 path 的父级/分组：展开子菜单作为候选让用户选 */
  | { status: 'groupCandidates'; group: MenuGroupNode; candidates: MenuCatalogEntry[] }
  | { status: 'forbidden'; entry: MenuCatalogEntry }
  | { status: 'notFound'; suggestions: MenuCatalogEntry[] }

/** 命中阈值：低于该分数视为「没找到」 */
const MATCH_THRESHOLD = 60
/** 候选/推荐最多返回条数 */
const MAX_CANDIDATES = 5

/**
 * 常见叫法 → 菜单名 的别名表。
 * 表驱动而非拼音库：不引入新依赖，覆盖业务高频简称。
 */
const MENU_ALIASES: Record<string, string[]> = {
  任务列表: ['任务', '任务清单'],
  采购订单: ['采购单', '订单', '订单列表'],
  采购需求: ['采购申请', '需求单'],
  施工库: ['施工', '施工资料', '施工项库'],
  工匠查询: ['工匠', '工匠列表'],
  工匠列表: ['工匠', '工匠库', '工匠管理'],
  工匠申请: ['工匠报名', '工匠进场'],
  菜单管理: ['菜单配置', '导航菜单'],
  用户管理: ['用户', '账号管理'],
  域管理: ['域', '域名管理'],
  材料: ['材料库', '材料列表'],
  退货: ['退货单', '退货管理'],
}

/** 归一化：小写、去空白与常见标点，去掉尾部「页面/菜单/模块」 */
function normalize(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[\s\u3000·\-_/()（）:：,，.。!！?？“”"'']/g, '')
    .replace(/(页面|菜单|模块)$/g, '')
}

/** 字符二元组集合，用于计算部分相似度（中文按字切分足够） */
function bigrams(text: string): Set<string> {
  const set = new Set<string>()
  for (let i = 0; i < text.length - 1; i += 1) {
    set.add(text.slice(i, i + 2))
  }
  return set
}

function bigramOverlap(a: string, b: string): number {
  if (a.length < 2 || b.length < 2) return 0
  const ga = bigrams(a)
  const gb = bigrams(b)
  let hit = 0
  ga.forEach((gram) => {
    if (gb.has(gram)) hit += 1
  })
  return hit / Math.min(ga.size, gb.size)
}

/** 计算查询与单个菜单条目的匹配分（0~100） */
function scoreEntry(query: string, entry: MenuCatalogEntry): number {
  const q = normalize(query)
  if (!q) return 0
  const label = normalize(entry.label)
  const key = normalize(entry.key)
  const aliases = MENU_ALIASES[entry.label] || []
  const normalizedAliases = aliases.map(normalize)

  if (q === label || q === key || normalizedAliases.includes(q)) return 100
  if (label.startsWith(q) || key.startsWith(q)) return 85
  if (normalizedAliases.some((alias) => alias.startsWith(q))) return 80
  if (label.includes(q) || key.includes(q)) return 70
  if (normalizedAliases.some((alias) => alias.includes(q))) return 68
  if (label.length >= 2 && q.includes(label)) return 62
  return Math.round(bigramOverlap(q, label) * 55)
}

interface ScoredEntry {
  entry: MenuCatalogEntry
  score: number
}

/** 在给定目录里匹配，返回唯一命中 / 多候选 / 无命中 + 相似推荐 */
function matchIn(
  query: string,
  catalog: MenuCatalogEntry[],
):
  | { kind: 'unique'; entry: MenuCatalogEntry }
  | { kind: 'ambiguous'; candidates: MenuCatalogEntry[] }
  | { kind: 'none'; suggestions: MenuCatalogEntry[] } {
  const scored: ScoredEntry[] = catalog
    .map((entry) => ({ entry, score: scoreEntry(query, entry) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  const best = scored[0]
  if (!best || best.score < MATCH_THRESHOLD) {
    return {
      kind: 'none',
      suggestions: scored.slice(0, MAX_CANDIDATES).map((item) => item.entry),
    }
  }

  // 与最高分相差 5 分以内视为同级候选（例如「采购订单」「采购订单明细」）
  const candidates = scored
    .filter((item) => item.score >= MATCH_THRESHOLD && best.score - item.score <= 5)
    .slice(0, MAX_CANDIDATES)
    .map((item) => item.entry)

  if (candidates.length > 1) return { kind: 'ambiguous', candidates }
  return { kind: 'unique', entry: candidates[0] }
}

/** 构建当前用户可访问的可导航菜单目录与分组目录（store 菜单已按权限过滤） */
export function buildAccessibleCatalog(): {
  entries: MenuCatalogEntry[]
  groups: MenuGroupNode[]
} {
  const { businessMenus, secondMenusMap } = useAppStore.getState()
  const entries: MenuCatalogEntry[] = []
  const groups: MenuGroupNode[] = []
  const seen = new Set<string>()

  const pushEntry = (
    key: string,
    label: string,
    path: string | undefined,
    parentLabel?: string,
  ): MenuCatalogEntry | null => {
    if (!path || !label) return null
    const dedupeKey = `${key}|${path}`
    if (seen.has(dedupeKey)) return null
    seen.add(dedupeKey)
    const entry = { key, label, path, parentLabel }
    entries.push(entry)
    return entry
  }

  const pushGroup = (
    key: string,
    label: string,
    parentLabel: string | undefined,
    children: NavMenu[],
    inheritedFirstLabel?: string,
  ): void => {
    const childEntries: MenuCatalogEntry[] = []
    children.forEach((child) => {
      const grandLabel = inheritedFirstLabel ?? parentLabel
      const pushed = pushEntry(child.key, child.label, child.path, grandLabel)
      if (pushed) childEntries.push(pushed)
      // 分组的分组（二级嵌套）：把孙菜单作为一级分组挂到 children 上
      if (child.children?.length) {
        pushGroup(child.key, child.label, child.label, child.children, grandLabel)
      }
    })
    if (childEntries.length > 0) {
      groups.push({ key, label, parentLabel, children: childEntries })
    }
  }

  businessMenus.forEach((first) => {
    // 一级菜单本身
    pushEntry(first.key, first.label, first.path)
    if (first.children?.length) {
      pushGroup(first.key, first.label, undefined, first.children)
    }
  })

  Object.entries(secondMenusMap).forEach(([firstKey, seconds]) => {
    const firstLabel = businessMenus.find((menu) => menu.key === firstKey)?.label
    // 秒级分组里的子菜单（业务上就是展开后的二级/三级）
    seconds.forEach((second) => {
      if (second.path) {
        pushEntry(second.key, second.label, second.path, firstLabel)
      }
      if (second.children?.length) {
        pushGroup(second.key, second.label, second.label, second.children, firstLabel)
      }
    })
  })

  return { entries, groups }
}

/** 分组节点上的简单名字打分（与 entry 规则一致） */
function scoreGroup(query: string, group: MenuGroupNode): number {
  return scoreEntry(query, {
    key: group.key,
    label: group.label,
    path: '', // 分组本身没 path
    parentLabel: group.parentLabel,
  } as MenuCatalogEntry)
}

/** 在分组集合里唯一命中；同级候选（分差 ≤5）返回多候选 */
function matchGroup(
  query: string,
  groups: MenuGroupNode[],
):
  | { kind: 'unique'; group: MenuGroupNode }
  | { kind: 'ambiguous'; groups: MenuGroupNode[] }
  | null {
  const scored = groups
    .map((group) => ({ group, score: scoreGroup(query, group) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  const best = scored[0]
  if (!best || best.score < MATCH_THRESHOLD) return null
  const candidates = scored.filter((item) => best.score - item.score <= 5).slice(0, MAX_CANDIDATES)
  if (candidates.length > 1) return { kind: 'ambiguous', groups: candidates.map((c) => c.group) }
  return { kind: 'unique', group: best.group }
}

/** 全量菜单缓存（用于区分「无权限」与「不存在」），按域隔离，60 秒有效 */
const fullCatalogCache: {
  domainId: string
  at: number
  entries: MenuCatalogEntry[]
} = { domainId: '', at: 0, entries: [] }
const FULL_CATALOG_TTL = 60_000

function flattenNavMenus(nodes: NavMenu[], parentLabel?: string, out: MenuCatalogEntry[] = []) {
  nodes.forEach((node) => {
    if (node.path) {
      out.push({
        key: node.key,
        label: node.label,
        path: node.path,
        parentLabel,
      })
    }
    if (node.children?.length) {
      flattenNavMenus(node.children, node.label, out)
    }
  })
  return out
}

/**
 * 拉取当前域全量菜单（不带 userId，即不按权限过滤）。
 * 默认域不带 domainId 参数，与 store 的请求方式保持一致。
 */
async function fetchFullCatalog(domainId: string): Promise<MenuCatalogEntry[]> {
  const now = Date.now()
  if (fullCatalogCache.domainId === domainId && now - fullCatalogCache.at < FULL_CATALOG_TTL) {
    return fullCatalogCache.entries
  }
  try {
    const query = domainId && domainId !== '1' ? `?domainId=${domainId}` : ''
    const res = await fetch(`${API_ENDPOINTS.NAV_MENUS}${query}`)
    const json = await res.json()
    if (json.code !== 200 || !Array.isArray(json.data)) return []
    const entries = flattenNavMenus(json.data as NavMenu[])
    fullCatalogCache.domainId = domainId
    fullCatalogCache.at = now
    fullCatalogCache.entries = entries
    return entries
  } catch {
    return []
  }
}

/** 读取当前域 ID（与项目既有取法一致：localStorage currentDomainId） */
export function getCurrentDomainId(): string {
  return localStorage.getItem('currentDomainId') || '1'
}

/**
 * 解析自然语言菜单名 → 菜单条目。
 * 先匹配可访问目录（带 path 的精确菜单）；未命中再匹配可访问分组（无 path 的父级/分组），
 * 分组命中则展开 children 作为候选；最后查全量目录区分「无权限」与「不存在」。
 */
export async function resolveMenuTarget(rawTarget: string): Promise<MenuResolution> {
  const { entries: accessible, groups } = buildAccessibleCatalog()

  // 1) 先在可访问的带 path 菜单里精确匹配
  const local = matchIn(rawTarget, accessible)
  if (local.kind === 'unique') return { status: 'unique', entry: local.entry }
  if (local.kind === 'ambiguous') return { status: 'ambiguous', candidates: local.candidates }

  // 2) 再在无 path 的分组里匹配（用户说的是分组名时展开子菜单）
  const groupHit = matchGroup(rawTarget, groups)
  if (groupHit?.kind === 'unique' && groupHit.group.children.length > 0) {
    return {
      status: 'groupCandidates',
      group: groupHit.group,
      candidates: groupHit.group.children,
    }
  }

  // 3) 最后查全量菜单（不带 userId），区分无权限 vs 不存在
  const full = await fetchFullCatalog(getCurrentDomainId())
  const accessibleKeys = new Set(accessible.map((entry) => `${entry.key}|${entry.path}`))
  const inaccessible = full.filter((entry) => !accessibleKeys.has(`${entry.key}|${entry.path}`))
  const remote = matchIn(rawTarget, inaccessible)
  if (remote.kind === 'unique') return { status: 'forbidden', entry: remote.entry }
  if (remote.kind === 'ambiguous') return { status: 'ambiguous', candidates: remote.candidates }

  // 全维度未命中：返回带 path 菜单里的相似推荐（优先于分组推荐）
  return { status: 'notFound', suggestions: local.suggestions }
}

/** 判断某菜单 key 是否在当前可访问目录内（供 AiActionGuard.checkPermission 使用） */
export function isMenuAccessible(menuKey: string, path: string): boolean {
  if (!menuKey || !path) return false
  return buildAccessibleCatalog().entries.some(
    (entry) => entry.key === menuKey && entry.path === path,
  )
}
