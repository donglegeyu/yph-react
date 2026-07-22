import type { PageDefinitionDTO, PageSchemaVO, FieldConfig, SelectOption } from './types'
import { toSnakeCase } from './types'
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
  createdBy: string | null
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
    createdBy: b.createdBy ?? '',
    createdTime: b.createdTime,
    updatedTime: b.updatedTime,
    isNewTable: schema.isNewTable ?? true,
    generateMenu: schema.generateMenu ?? true,
    menuLinkMode: (b.menuLinkMode as PageDefinitionDTO['menuLinkMode']) ?? 'new_child',
    parentMenuId: b.parentMenuId != null ? String(b.parentMenuId) : null,
    bindMenuId: b.bindMenuId != null ? String(b.bindMenuId) : null,
    treeConfig: schema.treeConfig ?? {
      enabled: false,
      expandColumnKey: 'name',
      childrenColumnName: 'children',
      levelIndent: 24,
    },
    fields: schema.fields ?? [],
    actions: schema.actions ?? [],
  } as PageDefinitionDTO
}

export async function listPageDefinitions(): Promise<ApiResult<PageDefinitionDTO[]>> {
  const res = await apiGet<PageResult<BackendPageDef>>(
    `${API_ENDPOINTS.PAGE_DEFINITIONS}?size=200`,
  )
  if (res.code !== 200) return error(res.message)
  return success(res.data.records.map(fromBackend))
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

export async function publishPageDefinition(id: string, domainId: number | null): Promise<ApiResult<null>> {
  const url = domainId != null
    ? `${API_ENDPOINTS.PAGE_DEFINITIONS}/${id}/publish?domainId=${domainId}`
    : `${API_ENDPOINTS.PAGE_DEFINITIONS}/${id}/publish`
  const res = await apiJson<null>(
    url,
    'POST',
  )
  if (res.code !== 200) return error(res.message)
  return success(null)
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
  if (field.isStatusTag && field.statusMap.length > 0) {
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
