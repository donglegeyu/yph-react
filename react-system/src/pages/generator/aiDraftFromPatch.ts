/**
 * 把 AI 补丁转换为「页面配置草稿」DTO。
 *
 * 仅用于生成器列表页：用户在 action 卡片上确认后，才把补丁落成一条 draft 记录；
 * 不做任何发布动作。字段默认值与新建向导保持一致（createEmptyField / createEmptyPage）。
 */
import {
  createEmptyField,
  createEmptyPage,
  toSnakeCase,
  type FieldConfig,
  type PageDefinitionDTO,
} from './types'
import { suggestApiPrefix, suggestFieldKey, suggestFromChinese, suggestTableName } from './services'

const FIELD_TYPES = new Set<string>([
  'input',
  'select',
  'select-multi',
  'radio',
  'cascader',
  'date',
  'daterange',
  'number',
  'status',
])
const TEMPLATE_TYPES = new Set<string>(['list_basic', 'list_tree', 'detail', 'form'])
const MENU_LINK_MODES = new Set<string>(['new_child', 'bind_existing'])

export interface AiDraftResult {
  dto: PageDefinitionDTO
  warnings: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

function readPositiveInt(value: unknown): number | null {
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? Math.floor(num) : null
}

function buildFields(raw: unknown, warnings: string[]): FieldConfig[] {
  if (!Array.isArray(raw)) {
    warnings.push('补丁未包含字段数组')
    return []
  }
  const fields: FieldConfig[] = []
  const usedKeys = new Set<string>()

  raw.forEach((item, index) => {
    if (!isRecord(item)) {
      warnings.push(`第 ${index + 1} 个字段格式非法，已忽略`)
      return
    }
    const label = readText(item.fieldLabel) || readText(item.fieldKey)
    if (!label) {
      warnings.push(`第 ${index + 1} 个字段缺少中文名，已忽略`)
      return
    }
    let key = readText(item.fieldKey) || suggestFieldKey(label) || `field${index + 1}`
    let suffix = 2
    while (usedKeys.has(key)) {
      key = `${readText(item.fieldKey) || suggestFieldKey(label) || 'field'}${suffix}`
      suffix += 1
    }
    usedKeys.add(key)

    const field = createEmptyField(fields.length)
    field.fieldLabel = label
    field.fieldKey = key
    field.dbColumn = readText(item.dbColumn) || toSnakeCase(key)
    const type = readText(item.fieldType)
    if (FIELD_TYPES.has(type)) {
      field.fieldType = type as FieldConfig['fieldType']
    } else if (type) {
      warnings.push(`字段「${label}」的 fieldType「${type}」不支持，已回退 input`)
    }
    const width = readPositiveInt(item.width)
    if (width !== null) field.width = width
    if (item.fixed === 'left' || item.fixed === 'right' || item.fixed === null) {
      field.fixed = item.fixed
    }
    if (typeof item.isFilter === 'boolean') field.isFilter = item.isFilter
    if (typeof item.sortable === 'boolean') field.sortable = item.sortable
    if (typeof item.isRequired === 'boolean') field.isRequired = item.isRequired
    const dbType = readText(item.dbType)
    if (dbType) field.dbType = dbType.toUpperCase()
    const dbLength = readPositiveInt(item.dbLength)
    if (dbLength !== null) field.dbLength = dbLength
    if (Array.isArray(item.options)) {
      field.options = item.options
        .filter(isRecord)
        .map((opt) => ({ label: readText(opt.label), value: readText(opt.value) }))
        .filter((opt) => opt.label || opt.value)
    }
    fields.push(field)
  })

  return fields
}

/**
 * 构造草稿 DTO。
 * @param patch 后端白名单校验后的补丁
 * @param existingPageKeys 已存在的页面 key（含草稿与已发布），用于避免 key 冲突
 */
export function buildDraftFromPatch(
  patch: Record<string, unknown>,
  existingPageKeys: string[] = [],
): AiDraftResult {
  const warnings: string[] = []
  const dto = createEmptyPage()

  const pageName = readText(patch.pageName)
  if (!pageName) warnings.push('补丁缺少页面名称，暂记为「未命名页面」')
  const baseKey = readText(patch.pageKey) || suggestFromChinese(pageName) || 'page'
  const used = new Set(existingPageKeys.map((key) => key.toLowerCase()))
  let pageKey = baseKey
  let index = 2
  while (used.has(pageKey.toLowerCase())) {
    pageKey = `${baseKey}-${index}`
    index += 1
  }
  if (pageKey !== baseKey) warnings.push(`页面 key「${baseKey}」已存在，已改用「${pageKey}」`)

  const templateType = readText(patch.templateType)
  if (templateType && !TEMPLATE_TYPES.has(templateType)) {
    warnings.push(`模板类型「${templateType}」不支持，已回退基础列表`)
  }
  const menuLinkMode = readText(patch.menuLinkMode)

  dto.pageName = pageName || '未命名页面'
  dto.pageKey = pageKey
  dto.templateType = TEMPLATE_TYPES.has(templateType) ? templateType : 'list_basic'
  dto.tableName = readText(patch.tableName) || suggestTableName(pageKey)
  dto.apiPrefix = readText(patch.apiPrefix) || suggestApiPrefix(pageKey)
  dto.menuLinkMode = MENU_LINK_MODES.has(menuLinkMode)
    ? (menuLinkMode as PageDefinitionDTO['menuLinkMode'])
    : 'new_child'
  dto.parentMenuId = readText(patch.parentMenuId) || null
  dto.bindMenuId = readText(patch.bindMenuId) || null
  dto.sourceListPageKey = readText(patch.sourceListPageKey)
  // 列表页 AI 只落草稿：默认不生成菜单，避免发布时自动建入口
  dto.generateMenu = typeof patch.generateMenu === 'boolean' ? patch.generateMenu : false
  dto.isNewTable = true
  dto.status = 'draft'
  dto.fields = buildFields(patch.fields, warnings)

  return { dto, warnings }
}
