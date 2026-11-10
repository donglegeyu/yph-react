import type { PageDefinitionDTO, PageSchemaVO, FieldConfig, SelectOption } from './types'
import { toSnakeCase, createEmptyFormPage } from './types'
import { pinyin } from 'pinyin-pro'
import { API_ENDPOINTS } from '@/constants/api'

interface ApiResult<T> {
  code: number
  message: string
  data: T
}

function success<T>(data: T): ApiResult<T> {
  return { code: 200, message: '操作成功', data }
}

function error<T = null>(message: string): ApiResult<T> {
  return { code: 500, message, data: null as unknown as T }
}

// 从 localStorage 读取当前登录用户名，附带到 X-User-Name header
function getCurrentUsername(): string {
  try {
    const raw = localStorage.getItem('app:userInfo')
    if (raw) {
      const info = JSON.parse(raw)
      if (info && typeof info.username === 'string' && info.username) {
        return info.username
      }
    }
  } catch {
    // ignore
  }
  return 'system'
}

async function apiGet<T>(url: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      headers: { 'X-User-Name': getCurrentUsername() },
    })
    const json = await res.json()
    return json as ApiResult<T>
  } catch (e) {
    return error((e as Error).message || '网络异常')
  }
}

async function apiJson<T>(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: unknown,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Name': getCurrentUsername(),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = await res.json()
    return json as ApiResult<T>
  } catch (e) {
    return error((e as Error).message || '网络异常')
  }
}

interface BackendPageDef {
  id: number
  pageKey: string
  pageName: string
  templateType: string
  tableName: string | null
  apiPrefix: string | null
  menuLinkMode: string
  parentMenuId: number | null
  bindMenuId: number | null
  schemaJson: string | null
  status: string
  migrationStatus?: string | null
  createdBy: string | null
  updatedBy: string | null
  createdTime: string
  updatedTime: string
}

interface PageResult<T> {
  records: T[]
  total: number
  current: number
  size: number
}

function fromBackend(b: BackendPageDef): PageDefinitionDTO {
  let schema: Partial<PageDefinitionDTO> = {}
  if (b.schemaJson) {
    try {
      schema = JSON.parse(b.schemaJson) as Partial<PageDefinitionDTO>
    } catch {
      schema = {}
    }
  }
  return {
    id: String(b.id),
    pageKey: b.pageKey,
    pageName: b.pageName,
    templateType: b.templateType,
    tableName: b.tableName ?? '',
    apiPrefix: b.apiPrefix ?? '',
    status: b.status as PageDefinitionDTO['status'],
    migrationStatus: b.migrationStatus ?? 'not_generated',
    createdBy: b.createdBy ?? '',
    updatedBy: b.updatedBy ?? '',
    createdTime: b.createdTime,
    updatedTime: b.updatedTime,
    isNewTable: schema.isNewTable ?? true,
    generateMenu: schema.generateMenu ?? true,
    menuLinkMode: (b.menuLinkMode as PageDefinitionDTO['menuLinkMode']) ?? 'new_child',
    parentMenuId: b.parentMenuId != null ? String(b.parentMenuId) : null,
    bindMenuId: b.bindMenuId != null ? String(b.bindMenuId) : null,
    detailHeader: schema.detailHeader ?? {
      primaryNameFieldKey: '',
      showAvatar: false,
      tags: [],
      tabs: [],
      titleActions: [],
    },
    formConfig: schema.formConfig ?? createEmptyFormPage(),
    treeConfig: schema.treeConfig ?? {
      enabled: false,
      expandColumnKey: 'name',
      childrenColumnName: 'children',
      levelIndent: 24,
    },
    fields: schema.fields ?? [],
    actions: schema.actions ?? [],
    toolbarButtons: schema.toolbarButtons ?? [],
    sourceListPageKey: schema.sourceListPageKey ?? '',
  }
}

export async function listPageDefinitions(): Promise<ApiResult<PageDefinitionDTO[]>> {
  const res = await apiGet<PageResult<BackendPageDef>>(
    `${API_ENDPOINTS.PAGE_DEFINITIONS}?size=200`,
  )
  if (res.code !== 200) return error(res.message)
  return success(res.data.records.map(fromBackend))
}

/**
 * 拉取已发布的列表页（list_basic / list_tree），供详情页「关联列表页」下拉选择
 */
export async function fetchPublishedListPages(): Promise<
  ApiResult<{ pageKey: string; pageName: string; templateType: string }[]>
> {
  const res = await listPageDefinitions()
  if (res.code !== 200) return error(res.message)
  const list = res.data
    .filter(
      (d) =>
        d.status === 'published' &&
        (d.templateType === 'list_basic' || d.templateType === 'list_tree'),
    )
    .map((d) => ({
      pageKey: d.pageKey,
      pageName: d.pageName,
      templateType: d.templateType,
    }))
  return success(list)
}

export async function getPageDefinition(
  id: string,
): Promise<ApiResult<PageDefinitionDTO | null>> {
  const res = await apiGet<PageDefinitionDTO>(
    `${API_ENDPOINTS.PAGE_DEFINITIONS}/${id}/schema`,
  )
  if (res.code !== 200) return error(res.message)
  return success(res.data)
}

/**
 * 动态查询业务数据（按 tableName 分页查询）
 * 由后端 DynamicQueryController 提供，前端用于动态列表页 / 详情页拉真实数据
 */
export interface DynamicQueryResult {
  records: Record<string, unknown>[]
  total: number
  current: number
  size: number
}

export interface DynamicQueryParams {
  table: string
  current?: number
  size?: number
  select?: string
  filter?: string
  orderBy?: string
}

export async function fetchDynamicQuery(
  params: DynamicQueryParams,
): Promise<ApiResult<DynamicQueryResult>> {
  const qs = new URLSearchParams()
  qs.set('table', params.table)
  qs.set('current', String(params.current ?? 1))
  qs.set('size', String(params.size ?? 20))
  if (params.select) qs.set('select', params.select)
  if (params.filter) qs.set('filter', params.filter)
  if (params.orderBy) qs.set('orderBy', params.orderBy)
  const res = await apiGet<DynamicQueryResult>(
    `${API_ENDPOINTS.DYNAMIC_QUERY}?${qs.toString()}`,
  )
  if (res.code !== 200) return error(res.message)
  return success(res.data)
}

/**
 * 动态表单页提交：新增 POST {apiPrefix}，编辑 PUT {apiPrefix}/{id}
 * 表单值原样 JSON 序列化（Dayjs 日期会被转成 ISO 字符串）
 */
export async function saveDynamicRecord(
  apiPrefix: string,
  id: string | null,
  body: unknown,
): Promise<ApiResult<unknown>> {
  const url = id ? `${apiPrefix}/${id}` : apiPrefix
  return apiJson<unknown>(url, id ? 'PUT' : 'POST', body)
}

/**
 * 把前端筛选表单的值对象转成后端 filter 字符串
 * 规则：
 * - 空值/空字符串/空数组 → 跳过
 * - 字符串 → field:like:value（模糊匹配，最常用场景）
 * - 数字/布尔 → field:eq:value
 * - 数组 → field:in:v1|v2|v3
 *
 * 特殊：以 __eq__ 开头的 key 用等值匹配（约定用法）
 */
export function buildFilterString(
  values: Record<string, unknown>,
  validFieldKeys: string[] = [],
): string {
  const parts: string[] = []
  for (const [key, val] of Object.entries(values)) {
    if (val === null || val === undefined) continue
    // 字段白名单：只接受已知 fieldKey（防注入绕过）
    if (validFieldKeys.length > 0 && !validFieldKeys.includes(key)) continue

    if (typeof val === 'string') {
      if (val.trim() === '') continue
      // 约定：key 以 __eq__ 前缀标记等值匹配
      if (key.startsWith('__eq__')) {
        const realKey = key.slice(5)
        if (validFieldKeys.length === 0 || validFieldKeys.includes(realKey)) {
          parts.push(`${realKey}:eq:${val.trim()}`)
        }
      } else {
        parts.push(`${key}:like:${val.trim()}`)
      }
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      parts.push(`${key}:eq:${String(val)}`)
    } else if (Array.isArray(val)) {
      const filtered = val.filter((v) => v !== null && v !== undefined && v !== '')
      if (filtered.length === 0) continue
      parts.push(`${key}:in:${filtered.map(String).join('|')}`)
    }
  }
  return parts.join(',')
}

export async function getPageSchemaByPageKey(
  pageKey: string,
): Promise<ApiResult<PageSchemaVO | null>> {
  // 后端暂无按 pageKey 查询的接口，先 list 后 filter
  const res = await listPageDefinitions()
  if (res.code !== 200) return error(res.message)
  const found = res.data.find((d) => d.pageKey === pageKey)
  if (!found) return success(null)
  return success({
    pageKey: found.pageKey,
    pageName: found.pageName,
    tableName: found.tableName,
    apiPrefix: found.apiPrefix,
    treeConfig: found.treeConfig,
    fields: found.fields,
    actions: found.actions,
    toolbarButtons: found.toolbarButtons || [],
    detailHeader: found.detailHeader,
  })
}

export async function savePageDefinition(
  input: PageDefinitionDTO,
): Promise<ApiResult<PageDefinitionDTO>> {
  if (!input.pageKey.trim()) return error('页面 key 不能为空')
  if (!input.pageName.trim()) return error('页面名称不能为空')

  // 后端返回 { data: <number> }（直接是新增/更新的 id）
  const res = await apiJson<number>(
    API_ENDPOINTS.PAGE_DEFINITION_SAVE,
    'POST',
    input,
  )
  if (res.code !== 200) return error(res.message)

  const newId = typeof res.data === 'number' ? String(res.data) : input.id
  const saved: PageDefinitionDTO = {
    ...input,
    id: newId,
    updatedTime: new Date().toISOString(),
  }
  return success(saved)
}

// ============= 建表迁移脚本（发布联动，只生成不执行） =============

/** 发布结果中的迁移脚本信息（与后端 PublishResultDTO 对应） */
export interface PublishResultData {
  scriptId: number | null
  scriptVersion: number | null
  fileName: string | null
  scriptType: 'create' | 'alter' | null
  content: string | null
  migrationStatus: string
}

/** 迁移脚本存档列表项（与后端 PageMigrationScript 对应） */
export interface MigrationScriptItem {
  id: number
  pageDefinitionId: number
  pageKey: string
  pageName: string
  version: number
  fileName: string
  scriptType: 'create' | 'alter'
  content: string
  createdBy: string | null
  createdTime: string
  migrationStatus: string | null
}

/** 就绪检查结果（与后端 ReadyCheckDTO 对应） */
export interface ReadyCheckData {
  tableExists: boolean
  status: string
  missingColumns: string[]
}

export async function publishPageDefinition(
  id: string,
  domainId: number | null,
): Promise<ApiResult<PublishResultData | null>> {
  const url = domainId != null
    ? `${API_ENDPOINTS.PAGE_DEFINITIONS}/${id}/publish?domainId=${domainId}`
    : `${API_ENDPOINTS.PAGE_DEFINITIONS}/${id}/publish`
  const res = await apiJson<PublishResultData | null>(url, 'POST')
  if (res.code !== 200) return error(res.message)
  return success(res.data)
}

export async function unpublishPageDefinition(id: string): Promise<ApiResult<null>> {
  const res = await apiJson<null>(
    `${API_ENDPOINTS.PAGE_DEFINITIONS}/${id}/unpublish`,
    'POST',
  )
  if (res.code !== 200) return error(res.message)
  return success(null)
}

/** 迁移脚本存档列表（最近 200 条，版本号倒序） */
export async function listMigrationScripts(): Promise<ApiResult<MigrationScriptItem[]>> {
  const res = await apiGet<MigrationScriptItem[]>('/api/page-migration-scripts')
  if (res.code !== 200) return error(res.message)
  return success(res.data ?? [])
}

/** 就绪检查：校验目标数据表与配置列是否真实存在 */
export async function checkMigrationReady(id: string): Promise<ApiResult<ReadyCheckData>> {
  const res = await apiJson<ReadyCheckData>(
    `${API_ENDPOINTS.PAGE_DEFINITIONS}/${id}/check-migration-ready`,
    'POST',
  )
  if (res.code !== 200) return error(res.message)
  return success(res.data)
}

/**
 * 下载到项目：把脚本写入本地 db/migration/ 目录
 * 仅本地开发环境可用（Vite dev 中间件 /__dev/write-migration-file），
 * 生产环境无此接口，调用会失败。
 * 项目红线：只写入文件，不执行任何 DDL，由研发评审后 Flyway 启动时执行。
 */
export async function saveMigrationFileLocal(
  fileName: string,
  content: string,
): Promise<ApiResult<null>> {
  try {
    const res = await fetch('/__dev/write-migration-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, content }),
    })
    const json = (await res.json()) as { ok?: boolean; message?: string }
    if (!res.ok || !json.ok) {
      return error(json.message || `写入失败（HTTP ${res.status}）`)
    }
    return success(null)
  } catch (e) {
    return error((e as Error).message || '写入失败：仅本地开发环境可用')
  }
}

export async function deletePageDefinition(id: string): Promise<ApiResult<null>> {
  const res = await apiJson<null>(
    `${API_ENDPOINTS.PAGE_DEFINITIONS}/${id}`,
    'DELETE',
  )
  if (res.code !== 200) return error(res.message)
  return success(null)
}

// ============= 远程数据源：动态选项查询 =============

export async function fetchMetaOptions(
  table: string,
  labelKey: string,
  valueKey: string,
  filter?: string,
): Promise<ApiResult<SelectOption[]>> {
  const params = new URLSearchParams({
    table,
    labelKey,
    valueKey,
  })
  if (filter) params.set('filter', filter)
  const res = await apiGet<SelectOption[]>(
    `${API_ENDPOINTS.META_OPTIONS}?${params.toString()}`,
  )
  if (res.code !== 200) return error(res.message)
  return success(res.data)
}

// ============= mock 数据生成（仍用于预览面板） =============

export function buildMockRecords(fields: FieldConfig[], count = 5): Record<string, unknown>[] {
  const records: Record<string, unknown>[] = []
  for (let i = 1; i <= count; i++) {
    const record: Record<string, unknown> = { id: i }
    fields.forEach((field) => {
      if (field.fieldKey === 'action') return
      if (field.isAction) return
      record[field.fieldKey] = mockValue(field, i)
    })
    records.push(record)
  }
  return records
}

function mockValue(field: FieldConfig, index: number): unknown {
  if ((field.fieldType === 'status' || field.isStatusTag) && field.statusMap.length > 0) {
    const pick = field.statusMap[index % field.statusMap.length]
    return pick?.value ?? ''
  }

  const dsFieldTypes = ['select', 'select-multi', 'radio', 'cascader']
  if (dsFieldTypes.includes(field.fieldType)) {
    const options = resolveMockOptions(field)
    if (options.length > 0) {
      const opt = options[index % options.length]
      return opt?.value ?? ''
    }
    return ''
  }

  switch (field.fieldType) {
    case 'number':
      return index * 10
    case 'date':
      return `2026-0${(index % 9) + 1}-15`
    case 'daterange':
      return [`2026-0${(index % 9) + 1}-01`, `2026-0${(index % 9) + 1}-28`]
    default:
      return `${field.fieldLabel}${index}`
  }
}

export function resolveMockOptions(field: FieldConfig): SelectOption[] {
  const ds = field.dataSource
  if (!ds) return field.options ?? []

  if (ds.kind === 'static') return ds.options

  if (ds.kind === 'tableRef') {
    return mockOptionsFromSeed(ds.table || field.fieldKey, [
      '示例A', '示例B', '示例C', '示例D', '示例E', '示例F',
    ])
  }

  if (ds.kind === 'api') {
    return mockOptionsFromSeed(ds.apiPath || field.fieldKey, [
      '选项1', '选项2', '选项3', '选项4',
    ])
  }

  if (ds.kind === 'dict') {
    return mockOptionsFromSeed(ds.dictKey || field.fieldKey, [
      '字典项A', '字典项B', '字典项C',
    ])
  }

  return []
}

function mockOptionsFromSeed(seed: string, labels: string[]): SelectOption[] {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return labels.map((label, i) => ({
    label: `${label}`,
    value: hash + i + 1,
  }))
}

export function buildTreeMockRecords(fields: FieldConfig[]): Record<string, unknown>[] {
  const flat = buildMockRecords(fields, 4)
  const childrenKey = 'children'
  return flat.map((parent, idx) => ({
    ...parent,
    id: idx + 1,
    [childrenKey]: [
      { ...buildMockRecords(fields, 2)[0], id: `${idx + 1}-1` },
      { ...buildMockRecords(fields, 2)[1], id: `${idx + 1}-2` },
    ],
  }))
}

export function suggestDbColumn(fieldKey: string): string {
  return toSnakeCase(fieldKey)
}

export function suggestFieldKey(fieldLabel: string): string {
  const trimmed = (fieldLabel || '').trim()
  if (!trimmed) return ''
  const arr = pinyin(trimmed, { toneType: 'none', type: 'array' }) as string[]
  const filtered = arr.filter(Boolean)
  if (filtered.length === 0) return ''
  return filtered
    .map((s, i) => (i === 0 ? s.toLowerCase() : s.charAt(0).toUpperCase() + s.slice(1)))
    .join('')
}

// 通用：从中文 label 派生 ASCII key（用于 actionKey/btnKey），label 为空时用 prefix+index 兜底
export function deriveKeyFromLabel(label: string, index: number, prefix: string): string {
  const trimmed = (label || '').trim()
  if (!trimmed) return `${prefix}${index + 1}`
  const arr = pinyin(trimmed, { toneType: 'none', type: 'array' }) as string[]
  const filtered = arr.filter(Boolean)
  if (filtered.length === 0) return `${prefix}${index + 1}`
  return filtered
    .map((s, i) => (i === 0 ? s.toLowerCase() : s.charAt(0).toUpperCase() + s.slice(1)))
    .join('')
}

export function suggestFromChinese(text: string): string {
  const trimmed = (text || '').trim()
  if (!trimmed) return ''
  const arr = pinyin(trimmed, { toneType: 'none', type: 'array' }) as string[]
  return arr.filter(Boolean).join('-').toLowerCase()
}

export function suggestTableName(pageKey: string): string {
  if (!pageKey) return ''
  return toSnakeCase(pageKey).replace(/-/g, '_')
}

export function suggestApiPrefix(pageKey: string): string {
  if (!pageKey) return ''
  return `/api/${pageKey.replace(/-/g, '-')}`
}
