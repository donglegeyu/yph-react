import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Form, Input, Select, TreeSelect, Button, Space, App, Radio, Splitter } from 'antd'
import { CompanyButton, CompanyMessage, SectionTitle, FormPageTemplate } from '@donglegeyu/company-ui'
import type { AiPageCapability, AiValidateIssue, AiValidateReport, FormPatch } from '@donglegeyu/company-ui'
import { registerPageCapability, resolvePageCapabilityKey } from '@/ai/pageCapabilityRegistry'
import { useAppStore } from '@/store/app'
import { DeleteOutlined, PlusOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import type { TextAreaRef } from 'antd/es/input/TextArea'
import type { PageDefinitionDTO, FieldConfig, ActionConfig, ActionType, ToolbarButtonConfig, ToolbarButtonType, DetailTagVariant, DetailTabContentType, FormFieldGroupConfig } from './types'
import {
  createEmptyField,
  createEmptyAction,
  createEmptyToolbarButton,
  createEmptyPage,
  createEmptyDetailHeader,
  createEmptyDetailTag,
  createEmptyDetailTab,
  createEmptyFieldGroup,
  createEmptyFooterButton,
  createEmptyFormFieldGroup,
  createFormFieldGroupId,
  normalizeFormFieldGroups,
  toSnakeCase,
  ACTION_TYPE_OPTIONS,
} from './types'
import { savePageDefinition, publishPageDefinition, suggestTableName, suggestApiPrefix, suggestFromChinese, suggestFieldKey, deriveKeyFromLabel, fetchPublishedListPages, listPageDefinitions } from './services'
import { API_ENDPOINTS } from '@/constants/api'
import { FieldCard } from './components/FieldEditor'
import PreviewPanel from './components/PreviewPanel'
import './PageGeneratorWizard.scss'

// 后端 nav_menu 返回结构（带数字 id）
interface NavMenuWithId {
  id: number
  key: string
  label: string
  parentId: number | null
  menuType?: string
  status?: number
  deleted?: number
  children?: NavMenuWithId[] | null
}

const TEMPLATE_OPTIONS = [
  { label: '列表页（基础）', value: 'list_basic' },
  { label: '列表页（树形）', value: 'list_tree' },
  { label: '详情页', value: 'detail' },
  { label: '表单页', value: 'form' },
]

interface Props {
  initial?: PageDefinitionDTO | null
}

// 老数据迁移：isStatusTag=true 的字段自动迁移成 fieldType='status'
function migrateLegacyStatusFields(cfg: PageDefinitionDTO): PageDefinitionDTO {
  if (!cfg.fields) return cfg
  let changed = false
  const fields = cfg.fields.map((f) => {
    if (f.isStatusTag && f.fieldType !== 'status') {
      changed = true
      return { ...f, fieldType: 'status' as const }
    }
    return f
  })
  // 兜底 detailHeader / formConfig（早期数据可能缺失）
  const detailHeader = cfg.detailHeader ?? createEmptyDetailHeader()
  if (!cfg.detailHeader) changed = true
  // formConfig 老结构（showFooter/submitText/cancelText/topContent）→ footerButtons（后端此前未存 formConfig，存量数据基本走兜底分支）
  let formConfig = cfg.formConfig
  if (!formConfig || !Array.isArray(formConfig.footerButtons)) {
    changed = true
    const legacy = (formConfig ?? {}) as { showFooter?: boolean; submitText?: string; cancelText?: string }
    formConfig =
      legacy.showFooter === false
        ? { footerButtons: [] }
        : {
            footerButtons: [
              { btnKey: 'btn-save', btnLabel: (legacy.submitText || '').trim() || '保存', btnType: 'primary', action: 'submit', sortOrder: 0 },
              { btnKey: 'btn-cancel', btnLabel: (legacy.cancelText || '').trim() || '取消', btnType: 'default', action: 'cancel', sortOrder: 1 },
            ],
          }
  }
  // 老数据兼容：补齐缺失的 fieldGroups；表单页固定扁平——分组中的字段拍平回 tab.fieldKeys
  const isFormPage = cfg.templateType === 'form'
  const tabs = detailHeader.tabs.map((t) => {
    const legacyGroups = (t as { fieldGroups?: { fieldKeys?: string[] }[] | null }).fieldGroups
    if (!legacyGroups || legacyGroups.length === 0) {
      if (Array.isArray(legacyGroups)) return t // 已是空数组，形态正确
      changed = true
      return { ...t, fieldGroups: [] } // null/undefined（老数据）：补齐
    }
    if (!isFormPage) return t // 详情页保留分组
    changed = true
    const merged = [...t.fieldKeys]
    legacyGroups.forEach((g) => {
      ;(g.fieldKeys || []).forEach((k) => {
        if (k && !merged.includes(k)) merged.push(k)
      })
    })
    const next = { ...t, fieldKeys: merged, fieldGroups: [] }
    return next
  })
  if (changed) {
    return { ...cfg, fields, detailHeader: { ...detailHeader, tabs }, formConfig }
  }
  return cfg
}

// 文本行 → 基础 FieldConfig（默认模式：中文名 + 自动推导 key）
function fieldFromLabel(label: string, idx: number): FieldConfig {
  const fieldKey = suggestFieldKey(label)
  return {
    ...createEmptyField(idx),
    fieldLabel: label,
    fieldKey,
    dbColumn: toSnakeCase(fieldKey),
  }
}

// 默认模式文本域 → FieldConfig[]（不识别分组语法，供详情页/列表页等平铺场景）
function parseFieldsText(text: string): FieldConfig[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((label, idx) => fieldFromLabel(label, idx))
}

// 文本域重建字段时按中文名匹配旧字段并继承其全部扩展配置（fieldType/width/开关/选项/数据源等），
// 避免切高级模式或保存时静默丢失已有配置；文本域的语义就是「字段中文名列表」，同名 = 同一字段，改名/新增视为新字段
function mergeParsedFields(parsed: FieldConfig[], oldFields: FieldConfig[]): FieldConfig[] {
  const oldByLabel = new Map(
    oldFields.filter((f) => f.fieldLabel.trim() && !f.isAction).map((f) => [f.fieldLabel.trim(), f]),
  )
  return parsed.map((p) => {
    const old = oldByLabel.get(p.fieldLabel.trim())
    return old ? { ...old, fieldLabel: p.fieldLabel } : p
  })
}

// 默认模式文本域（表单页）→ 字段 + 分组
// 分组语法：单独一行 [分组名] 或 【分组名】 开启分组，其后字段归入该组；标记前的行为未分组字段；同名标记合并为同一组
function parseFieldsTextWithGroups(text: string): {
  fields: FieldConfig[]
  groups: FormFieldGroupConfig[]
} {
  const groups: FormFieldGroupConfig[] = []
  const fields: FieldConfig[] = []
  let currentGroup: FormFieldGroupConfig | null = null
  text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((line) => {
      // [分组名] / 【分组名】；空名 [] 视为「未命名分组」标记（由「添加分组」按钮插入，用户可再填写）
      const m = line.match(/^[【\[]([^】\]]*)[】\]]$/)
      if (m) {
        const name = m[1].trim()
        const existing = groups.find((g) => g.name === name)
        if (existing) {
          currentGroup = existing
        } else {
          currentGroup = { id: createFormFieldGroupId(), name }
          groups.push(currentGroup)
        }
        return
      }
      const field = fieldFromLabel(line, fields.length)
      if (currentGroup) field.groupId = currentGroup.id
      fields.push(field)
    })
  return { fields, groups }
}

// 字段 + 分组 → 默认模式文本域文本
// 顺序与运行时渲染一致：未分组字段在前，其后按组序展开（[组名] 行 + 组内字段）
function serializeFieldsText(fields: FieldConfig[], groups?: FormFieldGroupConfig[]): string {
  const groupList = groups ?? []
  const groupIds = new Set(groupList.map((g) => g.id))
  const lines: string[] = fields
    .filter((f) => !f.isAction && (!f.groupId || !groupIds.has(f.groupId)))
    .map((f) => f.fieldLabel)
    .filter(Boolean)
  groupList.forEach((g) => {
    lines.push(`[${g.name || '未命名分组'}]`)
    fields
      .filter((f) => !f.isAction && f.groupId === g.id)
      .forEach((f) => {
        if (f.fieldLabel) lines.push(f.fieldLabel)
      })
  })
  return lines.join('\n')
}

// 默认模式文本域 → 完整 ActionConfig[]
function parseActionsText(text: string): ActionConfig[] {
  const lines = text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  return lines.map((label, idx) => {
    let actionType: ActionType = 'custom'
    if (label === '详情') actionType = 'detail'
    else if (label === '编辑') actionType = 'edit'
    else if (label === '删除') actionType = 'delete'
    const actionKey = deriveKeyFromLabel(label, idx, 'action')
    return {
      ...createEmptyAction(idx),
      actionLabel: label,
      actionType,
      actionKey,
    }
  })
}

// 默认模式：确保有一个操作列（fieldKey=action）
function ensureActionColumn(fields: FieldConfig[]): FieldConfig[] {
  const existing = fields.find((f) => f.isAction)
  if (existing) return [...fields]
  const actionField = createEmptyField(0)
  actionField.isAction = true
  actionField.fieldKey = 'action'
  actionField.fieldLabel = '操作'
  actionField.fixed = 'right'
  actionField.isFilter = false
  actionField.width = 168
  return [...fields, actionField]
}

// 默认模式：把工具栏文本域解析成 ToolbarButtonConfig[]
// 第一行识别为主按钮（primary），其余为次按钮（default）
function parseToolbarText(text: string): ToolbarButtonConfig[] {
  const lines = text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  return lines.map((label, idx) => {
    const isPrimary = idx === 0
    const btnType: ToolbarButtonType = isPrimary ? 'primary' : 'default'
    const btnKey = deriveKeyFromLabel(label, idx, 'btn')
    return {
      ...createEmptyToolbarButton(idx),
      btnLabel: label,
      btnType,
      btnKey,
    }
  })
}

// ===== AI 页面能力（P2）：补丁解析与防御 =====
const AI_FIELD_TYPES = new Set<string>([
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
const AI_TEMPLATE_TYPES = new Set<string>(['list_basic', 'list_tree', 'detail', 'form'])
const AI_MENU_LINK_MODES = new Set<string>(['new_child', 'bind_existing'])
const AI_TOP_LEVEL_KEYS = new Set<string>([
  'pageName',
  'pageKey',
  'templateType',
  'tableName',
  'apiPrefix',
  'generateMenu',
  'menuLinkMode',
  'parentMenuId',
  'bindMenuId',
  'sourceListPageKey',
  'fields',
])

interface PageAiBackfillResult {
  ok: boolean
  errors: string[]
  warnings: string[]
  config?: PageDefinitionDTO
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function readPositiveNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    if (Number.isFinite(n) && n > 0) return n
  }
  return null
}

function cloneDraft<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export default function PageGeneratorWizard({ initial }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const { modal } = App.useApp()
  const [config, setConfig] = useState<PageDefinitionDTO>(
    normalizeFormFieldGroups(migrateLegacyStatusFields(initial ?? createEmptyPage())),
  )
  const isDetail = config.templateType === 'detail'
  const isForm = config.templateType === 'form'
  const [saving, setSaving] = useState(false)
  const [keyTouched, setKeyTouched] = useState(false)
  // 编辑已有配置时：若字段带有文本域无法表达的配置（控件类型/选项/状态映射/数据源），初始进入高级模式，
  // 否则默认模式的 previewConfig 会用 parseFieldsText 重建字段，导致 fieldType 等配置丢失（预览全变输入框）。
  // 表单分组已可在默认模式用 [分组名] 语法表达，不再强制高级模式
  const [mode, setMode] = useState<'default' | 'advanced'>(() => {
    const fields = (initial?.fields ?? []).filter((f) => !f.isAction)
    const hasRichConfig = fields.some(
      (f) =>
        f.fieldType !== 'input' ||
        (f.options?.length ?? 0) > 0 ||
        (f.statusMap?.length ?? 0) > 0 ||
        !!f.dataSource,
    )
    return hasRichConfig ? 'advanced' : 'default'
  })
  // 从后端拉取的 nav_menu 列表（带数字 id，用于菜单关联选择）
  const [navMenus, setNavMenus] = useState<NavMenuWithId[]>([])
  // 已发布的列表页（供详情页「关联列表页」下拉选择）
  const [publishedListPages, setPublishedListPages] = useState<
    { pageKey: string; pageName: string; templateType: string }[]
  >([])
  // 同步字段时的 loading
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    let cancelled = false
    // 跟 store.fetchMenus 保持一致：默认域直接拉全量；非默认域合并「当前域菜单 + 系统菜单」
    const currentDomainId = localStorage.getItem('currentDomainId')
    const isDefaultDomain = !currentDomainId || currentDomainId === '1'

    const handleJson = (json: { code: number; data?: NavMenuWithId[] }) => {
      if (cancelled) return
      if (json.code === 200 && Array.isArray(json.data)) {
        setNavMenus((prev) => {
          // 合并去重（按 id），保留 children 更完整的版本
          const map = new Map<number, NavMenuWithId>()
          prev.forEach((m) => map.set(m.id, m))
          json.data!.forEach((m) => {
            const exist = map.get(m.id)
            const existChildrenLen = exist?.children?.length ?? 0
            const newChildrenLen = m.children?.length ?? 0
            // 没有则加入；有则取 children 更多的
            if (!exist || newChildrenLen > existChildrenLen) {
              map.set(m.id, m)
            }
          })
          return Array.from(map.values())
        })
      }
    }

    if (isDefaultDomain) {
      // 默认域：拿全量，但只保留业务菜单
      fetch(API_ENDPOINTS.NAV_MENUS)
        .then((r) => r.json())
        .then((json) => {
          if (
            json.code === 200 &&
            Array.isArray(json.data)
          ) {
            const businessOnly: NavMenuWithId[] = (
              json.data as NavMenuWithId[]
            ).filter((m) => m.menuType === '业务菜单')
            handleJson({ code: 200, data: businessOnly })
          }
        })
        .catch(() => {})
    } else {
      // 非默认域：只拿当前域的业务菜单
      fetch(`${API_ENDPOINTS.NAV_MENUS}?domainId=${currentDomainId}`)
        .then((r) => r.json())
        .then((json) => {
          if (
            json.code === 200 &&
            Array.isArray(json.data)
          ) {
            const businessOnly: NavMenuWithId[] = (
              json.data as NavMenuWithId[]
            ).filter((m) => m.menuType === '业务菜单')
            handleJson({ code: 200, data: businessOnly })
          }
        })
        .catch(() => {})
    }

    return () => {
      cancelled = true
    }
  }, [])

  // 拉取已发布的列表页（供详情页关联选择）
  useEffect(() => {
    let cancelled = false
    fetchPublishedListPages().then((res) => {
      if (cancelled) return
      if (res.code === 200 && Array.isArray(res.data)) {
        setPublishedListPages(res.data)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  // 详情页：从关联列表页一键同步字段
  // - 默认模式：把字段中文名同步到 fieldsText 文本域
  // - 高级模式：把完整 FieldConfig 同步到 config.fields，并带 tableName/apiPrefix
  const handleSyncFieldsFromList = async () => {
    if (!config.sourceListPageKey) {
      CompanyMessage.warning('请先选择关联列表页')
      return
    }
    setSyncing(true)
    try {
      const res = await listPageDefinitions()
      if (res.code !== 200) {
        CompanyMessage.error(res.message)
        return
      }
      const sourcePage = res.data.find((d) => d.pageKey === config.sourceListPageKey)
      if (!sourcePage) {
        CompanyMessage.error('未找到关联的列表页')
        return
      }
      const sourceFields = (sourcePage.fields ?? []).filter(
        (f) => !f.isAction && f.fieldKey,
      )
      if (sourceFields.length === 0) {
        CompanyMessage.warning('关联列表页暂无可同步的字段')
        return
      }

      if (mode === 'default') {
        const labels = sourceFields.map((f) => f.fieldLabel).filter(Boolean)
        modal.confirm({
          title: '确认同步字段名',
          content: `将从「${sourcePage.pageName}」导入 ${labels.length} 个字段名到文本域，覆盖当前内容，是否继续？`,
          onOk: () => {
            setFieldsText(labels.join('\n'))
            // 同步业务表信息（默认模式不展示这两个字段，但保存时会用到）
            patchConfig({
              tableName: sourcePage.tableName || config.tableName,
              apiPrefix: sourcePage.apiPrefix || config.apiPrefix,
            })
            CompanyMessage.success(`已同步 ${labels.length} 个字段名`)
          },
        })
        return
      }

      // 高级模式：完整字段配置同步
      const detailFields = sourceFields.map((f, i) => ({
        ...f,
        sortOrder: i,
        isFilter: false,
      }))
      modal.confirm({
        title: '确认同步字段',
        content: `将从「${sourcePage.pageName}」导入 ${detailFields.length} 个字段，覆盖当前详情页字段配置，是否继续？`,
        onOk: () => {
          setConfig((prev) => ({
            ...prev,
            fields: detailFields,
            tableName: sourcePage.tableName || prev.tableName,
            apiPrefix: sourcePage.apiPrefix || prev.apiPrefix,
          }))
          CompanyMessage.success(`已同步 ${detailFields.length} 个字段`)
        },
      })
    } finally {
      setSyncing(false)
    }
  }

  // 默认模式文本域：字段/操作列按钮，每行一项；表单页带 [分组名] 行（与 config 分组数据互转）
  const [fieldsText, setFieldsText] = useState(() =>
    serializeFieldsText(config.fields, config.formConfig?.fieldGroups),
  )
  // 文本域 ref：用 antd 的 TextAreaRef 类型（antd 6 的 TextArea ref 不再是原生 DOM 类型）
  const fieldsTextRef = useRef<TextAreaRef>(null)
  // 默认模式表单页：「添加分组」按钮 → 在文本域末尾追加一行 [组名] 标记（组名由用户自行填写）
  const handleAddGroupMarker = () => {
    setFieldsText((prev) => {
      const suffix = prev.length > 0 && !prev.endsWith('\n') ? '\n' : ''
      return prev + suffix + '[]'
    })
    fieldsTextRef.current?.focus()
  }
  const [actionsText, setActionsText] = useState(() =>
    (initial?.actions ?? [])
      .map((a) => a.actionLabel)
      .filter(Boolean)
      .join('\n'),
  )
  // 默认模式文本域：工具栏按钮（第一行为主按钮 create，其余为 custom）
  const [toolbarText, setToolbarText] = useState(() =>
    (initial?.toolbarButtons ?? [])
      .map((b) => b.btnLabel)
      .filter(Boolean)
      .join('\n'),
  )

  // 基于 nav_menu 数字 id 的菜单树（用于「父菜单」/「已有菜单」选择）
  const menuTreeDataById = useMemo<DataNode[]>(() => {
    const build = (items?: NavMenuWithId[] | null): DataNode[] =>
      (items || [])
        .filter((m) => m.deleted !== 1 && m.status !== 0)
        .map((m) => ({
          key: String(m.id),
          title: m.label,
          value: String(m.id),
          children: build(m.children),
        }))
    return build(navMenus)
  }, [navMenus])

  // 默认模式：文本域实时同步为 config.fields/config.actions，供预览面板使用
  const previewConfig = useMemo<PageDefinitionDTO>(() => {
    if (mode !== 'default') return config
    // 表单页识别 [分组名] 分组语法；详情页/列表页平铺
    const parsed = isForm
      ? parseFieldsTextWithGroups(fieldsText)
      : { fields: parseFieldsText(fieldsText), groups: [] as FormFieldGroupConfig[] }
    const parsedActions = parseActionsText(actionsText)
    // 仅当存在 actions 时才附加操作列
    const fieldsWithAction =
      parsedActions.length > 0 ? ensureActionColumn(parsed.fields) : parsed.fields
    const parsedToolbar = parseToolbarText(toolbarText)
    return {
      ...config,
      fields: fieldsWithAction.map((f, i) => ({
        ...f,
        sortOrder: i,
      })),
      actions: parsedActions.map((a, i) => ({ ...a, sortOrder: i })),
      toolbarButtons: parsedToolbar.map((b, i) => ({ ...b, sortOrder: i })),
      ...(isForm
        ? { formConfig: { ...config.formConfig, fieldGroups: parsed.groups } }
        : {}),
    }
  }, [mode, config, isForm, fieldsText, actionsText, toolbarText])

  const patchConfig = useCallback((p: Partial<PageDefinitionDTO>) => {
    setConfig((prev) => ({ ...prev, ...p }))
  }, [])

  const onPageKeyChange = (val: string) => {
    const kebab = val.replace(/[\s_]+/g, '-').toLowerCase()
    setKeyTouched(true)
    patchConfig({
      pageKey: kebab,
      tableName: suggestTableName(kebab),
      apiPrefix: suggestApiPrefix(kebab),
    })
  }

  const onPageNameChange = (val: string) => {
    patchConfig({ pageName: val })
    if (keyTouched) return
    const suggested = suggestFromChinese(val)
    patchConfig({
      pageKey: suggested,
      tableName: suggestTableName(suggested),
      apiPrefix: suggestApiPrefix(suggested),
    })
  }

  const onTableNameChange = (val: string) => {
    patchConfig({ tableName: toSnakeCase(val) })
  }

  const onApiPrefixChange = (val: string) => {
    setKeyTouched(true)
    patchConfig({ apiPrefix: val })
  }

  const addField = (groupId?: string) => {
    const next = { ...createEmptyField(config.fields.length) }
    if (groupId) next.groupId = groupId
    setConfig((prev) => ({ ...prev, fields: [...prev.fields, next] }))
  }

  // ===== 表单页分组管理（先建组，字段入组）=====
  const patchFormGroups = (groups: FormFieldGroupConfig[]) => {
    setConfig((prev) => ({
      ...prev,
      formConfig: { ...prev.formConfig, fieldGroups: groups },
    }))
  }

  const addGroup = () => {
    patchFormGroups([...(config.formConfig?.fieldGroups ?? []), createEmptyFormFieldGroup()])
  }

  const renameGroup = (gid: string, name: string) => {
    patchFormGroups(
      (config.formConfig?.fieldGroups ?? []).map((g) => (g.id === gid ? { ...g, name } : g)),
    )
  }

  const moveGroup = (idx: number, delta: -1 | 1) => {
    const groups = [...(config.formConfig?.fieldGroups ?? [])]
    const target = idx + delta
    if (target < 0 || target >= groups.length) return
    ;[groups[idx], groups[target]] = [groups[target], groups[idx]]
    patchFormGroups(groups)
  }

  const removeGroup = (g: FormFieldGroupConfig) => {
    const count = config.fields.filter((f) => f.groupId === g.id).length
    modal.confirm({
      title: '删除分组',
      content: count
        ? `组内 ${count} 个字段将变为未分组字段，字段本身不会被删除。`
        : '确定删除该分组吗？',
      onOk: () => {
        setConfig((prev) => ({
          ...prev,
          formConfig: {
            ...prev.formConfig,
            fieldGroups: (prev.formConfig?.fieldGroups ?? []).filter((x) => x.id !== g.id),
          },
          fields: prev.fields.map((f) => (f.groupId === g.id ? { ...f, groupId: undefined } : f)),
        }))
      },
    })
  }

  const updateField = (idx: number, field: FieldConfig) => {
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) => (i === idx ? field : f)),
    }))
  }

  // 字段卡片渲染（详情页平铺 / 表单页分组视图共用；用引用定位原始下标，分组视图不改变 fields 顺序）
  const renderFieldCard = (field: FieldConfig) => {
    const idx = config.fields.indexOf(field)
    return (
      <FieldCard
        key={idx}
        value={field}
        onChange={(f) => updateField(idx, f)}
        mode={isForm ? 'form' : 'detail'}
        groups={isForm ? config.formConfig?.fieldGroups : undefined}
        index={idx}
        onDelete={() => handleDeleteFieldConfirm(idx, field.fieldLabel)}
      />
    )
  }

  // 表单页未入组字段（groupId 为空或指向已删除的组），平铺显示在前
  const formGroupIds = new Set((config.formConfig?.fieldGroups ?? []).map((g) => g.id))
  const formUngroupedFields = isForm
    ? config.fields.filter((f) => !f.groupId || !formGroupIds.has(f.groupId))
    : []

  const removeField = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== idx),
    }))
  }

  const addAction = () => {
    const next = createEmptyAction(config.actions.length)
    setConfig((prev) => ({ ...prev, actions: [...prev.actions, next] }))
  }

  const updateAction = (idx: number, action: ActionConfig) => {
    setConfig((prev) => ({
      ...prev,
      actions: prev.actions.map((a, i) => (i === idx ? action : a)),
    }))
  }

  const removeAction = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== idx),
    }))
  }

  // toolbar 按钮增删改
  const addToolbarButton = () => {
    const next = createEmptyToolbarButton(config.toolbarButtons.length)
    setConfig((prev) => ({
      ...prev,
      toolbarButtons: [...(prev.toolbarButtons || []), next],
    }))
  }

  const updateToolbarButton = (idx: number, btn: ToolbarButtonConfig) => {
    setConfig((prev) => ({
      ...prev,
      toolbarButtons: (prev.toolbarButtons || []).map((b, i) => (i === idx ? btn : b)),
    }))
  }

  const removeToolbarButton = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      toolbarButtons: (prev.toolbarButtons || []).filter((_, i) => i !== idx),
    }))
  }

  const validateBeforeSave = useCallback((cfg: PageDefinitionDTO): string | null => {
    if (!cfg.pageKey.trim()) return '页面 key 不能为空'
    if (!cfg.pageName.trim()) return '页面名称不能为空'
    if (!cfg.tableName.trim()) return '业务表名不能为空'
    if (!cfg.apiPrefix.trim()) return 'API 前缀不能为空'
    const validFields = cfg.fields.filter((f) => f.fieldKey.trim())
    if (validFields.length === 0) return '至少配置一个字段'
    const actionFields = validFields.filter((f) => f.isAction)
    if (actionFields.length > 1) return '只能有一个操作列'
    const dupKeys = new Set<string>()
    for (const f of validFields) {
      if (dupKeys.has(f.fieldKey)) return `字段 key「${f.fieldKey}」重复`
      dupKeys.add(f.fieldKey)
    }
    return null
  }, [])

  // ===== AI 页面能力（P2）：上下文、回填、撤销、核验 =====
  const activeTabKey = useAppStore((s) => s.activeTabKey)
  const capabilityKey = resolvePageCapabilityKey(activeTabKey, location.pathname)

  // 默认模式下文本域才是用户正在编辑的字段列表：把文本域解析结果与 config 合并，
  // 既保留用户刚输入的行，也保留旧字段的扩展配置（类型/宽度/开关等）。
  const buildEffectiveDraft = useCallback(
    (source: {
      config: PageDefinitionDTO
      fieldsText: string
      mode: 'default' | 'advanced'
    }): PageDefinitionDTO => {
      if (source.mode !== 'default') return source.config
      const base = source.config
      const parsed = isForm
        ? parseFieldsTextWithGroups(source.fieldsText)
        : { fields: parseFieldsText(source.fieldsText), groups: [] as FormFieldGroupConfig[] }
      return {
        ...base,
        fields: [
          ...mergeParsedFields(parsed.fields, base.fields),
          ...base.fields.filter((f) => f.isAction),
        ],
        ...(isForm ? { formConfig: { ...base.formConfig, fieldGroups: parsed.groups } } : {}),
      }
    },
    [isForm],
  )

  // 用 ref 暴露最新草稿：capability 只注册一次，也能读到实时状态
  const draftRef = useRef({
    config,
    fieldsText,
    mode,
    effectiveConfig: buildEffectiveDraft({ config, fieldsText, mode }),
  })
  draftRef.current = {
    config,
    fieldsText,
    mode,
    effectiveConfig: buildEffectiveDraft({ config, fieldsText, mode }),
  }

  const undoStackRef = useRef<{ config: PageDefinitionDTO; fieldsText: string }[]>([])
  const MAX_AI_UNDO = 5

  const applyDraft = useCallback((nextConfig: PageDefinitionDTO, nextFieldsText: string) => {
    // 两份状态同时写入，保证默认/高级模式切换后看到同一份字段
    setConfig(nextConfig)
    setFieldsText(nextFieldsText)
  }, [])

  const backfill = useCallback(
    (patch: FormPatch): PageAiBackfillResult => {
      const draft = draftRef.current
      const errors: string[] = []
      const warnings: string[] = []
      // 以「当前可见草稿」为基线，补丁只做增量合并
      const base = draft.effectiveConfig

      Object.keys(patch).forEach((key) => {
        if (!AI_TOP_LEVEL_KEYS.has(key)) warnings.push(`忽略未知配置项：${key}`)
      })

      const topLevel: Partial<PageDefinitionDTO> = {}

      const pageName = readString(patch.pageName)
      if (pageName !== null) {
        if (!pageName.trim()) errors.push('页面名称不能为空')
        else topLevel.pageName = pageName.trim()
      }
      const pageKey = readString(patch.pageKey)
      if (pageKey !== null) {
        const kebab = pageKey.replace(/[\s_]+/g, '-').toLowerCase()
        if (!kebab.trim()) errors.push('页面 key 不能为空')
        else topLevel.pageKey = kebab
      }
      // 只给了页面名、且草稿还没有 key 时自动推导，避免保存被「key 不能为空」卡住
      if (!topLevel.pageKey && topLevel.pageName && !base.pageKey.trim()) {
        topLevel.pageKey = topLevel.pageName.replace(/[\s_]+/g, '-').toLowerCase()
      }

      const templateType = readString(patch.templateType)
      if (templateType !== null) {
        if (!AI_TEMPLATE_TYPES.has(templateType)) {
          errors.push(`不支持的页面类型：${templateType}`)
        } else {
          topLevel.templateType = templateType
        }
      }

      const tableName = readString(patch.tableName)
      if (tableName !== null) {
        if (!tableName.trim()) errors.push('业务表名不能为空')
        else topLevel.tableName = tableName.trim()
      }
      const apiPrefix = readString(patch.apiPrefix)
      if (apiPrefix !== null) {
        if (!apiPrefix.trim()) errors.push('API 前缀不能为空')
        else topLevel.apiPrefix = apiPrefix.trim()
      }
      const sourceListPageKey = readString(patch.sourceListPageKey)
      if (sourceListPageKey !== null) topLevel.sourceListPageKey = sourceListPageKey.trim()

      if (typeof patch.generateMenu === 'boolean') topLevel.generateMenu = patch.generateMenu

      const menuLinkMode = readString(patch.menuLinkMode)
      if (menuLinkMode !== null) {
        if (!AI_MENU_LINK_MODES.has(menuLinkMode)) {
          errors.push(`不支持的挂载方式：${menuLinkMode}`)
        } else {
          topLevel.menuLinkMode = menuLinkMode as PageDefinitionDTO['menuLinkMode']
        }
      }
      for (const key of ['parentMenuId', 'bindMenuId'] as const) {
        if (!(key in patch)) continue
        const raw = patch[key]
        if (raw === null) topLevel[key] = null
        else if (typeof raw === 'string') topLevel[key] = raw.trim() || null
        else if (typeof raw === 'number') topLevel[key] = String(raw)
        else errors.push(`${key} 必须是字符串、数字或 null`)
      }

      // 字段增量合并：补丁未提及的字段、操作列、分组一律保留
      const nextFields = base.fields.map((f) => ({ ...f }))
      const additions: FieldConfig[] = []
      const indexByKey = new Map<string, number>()
      const indexByLabel = new Map<string, number>()
      nextFields.forEach((f, i) => {
        if (f.isAction) return
        if (f.fieldKey) indexByKey.set(f.fieldKey, i)
        if (f.fieldLabel) indexByLabel.set(f.fieldLabel, i)
      })
      // additions 的虚拟下标从 nextFields.length 开始，补丁内重复字段也能命中同一条
      const fieldAt = (idx: number): FieldConfig =>
        idx < nextFields.length ? nextFields[idx] : additions[idx - nextFields.length]
      const setFieldAt = (idx: number, field: FieldConfig): void => {
        if (idx < nextFields.length) nextFields[idx] = field
        else additions[idx - nextFields.length] = field
      }

      const fieldsPatch = patch.fields
      if (fieldsPatch !== undefined && !Array.isArray(fieldsPatch)) {
        errors.push('fields 必须是字段数组')
      }
      if (Array.isArray(fieldsPatch)) {
        fieldsPatch.forEach((raw, i) => {
          if (!isRecord(raw)) {
            errors.push(`第 ${i + 1} 个字段格式非法`)
            return
          }
          const labelRaw = readString(raw.fieldLabel)
          const keyRaw = readString(raw.fieldKey)
          const label = labelRaw?.trim() ?? ''
          const key = keyRaw?.trim() ?? ''
          if (!label && !key) {
            errors.push(`第 ${i + 1} 个字段缺少 fieldLabel 或 fieldKey`)
            return
          }
          const typeRaw = readString(raw.fieldType)
          if (typeRaw !== null && !AI_FIELD_TYPES.has(typeRaw)) {
            errors.push(`字段「${label || key}」的 fieldType「${typeRaw}」不支持`)
            return
          }

          let index = key ? indexByKey.get(key) : undefined
          if (index === undefined && label) index = indexByLabel.get(label)

          let nextField: FieldConfig
          if (index !== undefined) {
            nextField = { ...fieldAt(index) }
          } else {
            nextField = createEmptyField(nextFields.length + additions.length)
          }

          if (label) nextField.fieldLabel = label
          if (key) nextField.fieldKey = key
          if (!nextField.fieldKey) nextField.fieldKey = suggestFieldKey(nextField.fieldLabel)
          if (!nextField.dbColumn) nextField.dbColumn = toSnakeCase(nextField.fieldKey)
          if (!nextField.fieldLabel.trim()) errors.push(`第 ${i + 1} 个字段缺少中文字段名`)
          if (typeRaw !== null) nextField.fieldType = typeRaw as FieldConfig['fieldType']

          const width = readPositiveNumber(raw.width)
          if (width !== null) nextField.width = width
          if ('fixed' in raw) {
            const fixed = raw.fixed
            if (fixed === null || fixed === 'left' || fixed === 'right') {
              nextField.fixed = fixed
            } else {
              errors.push(`字段「${label || key}」的 fixed 只能是 left/right/null`)
            }
          }
          for (const boolKey of ['isFilter', 'sortable', 'isRequired'] as const) {
            if (typeof raw[boolKey] === 'boolean') nextField[boolKey] = raw[boolKey]
          }
          const dbColumn = readString(raw.dbColumn)
          if (dbColumn !== null) {
            nextField.dbColumn = dbColumn.trim() || toSnakeCase(nextField.fieldKey)
          }
          const dbType = readString(raw.dbType)
          if (dbType !== null) nextField.dbType = dbType.trim().toUpperCase()
          const dbLength = readPositiveNumber(raw.dbLength)
          if (dbLength !== null) nextField.dbLength = dbLength
          if (Array.isArray(raw.options)) {
            nextField.options = raw.options
              .filter(isRecord)
              .map((opt) => ({
                label: readString(opt.label) ?? '',
                value: readString(opt.value) ?? '',
              }))
              .filter((opt) => opt.label || opt.value)
          }

          if (index !== undefined) {
            setFieldAt(index, nextField)
            indexByKey.set(nextField.fieldKey, index)
            indexByLabel.set(nextField.fieldLabel, index)
          } else {
            additions.push(nextField)
            const newIndex = nextFields.length + additions.length - 1
            indexByKey.set(nextField.fieldKey, newIndex)
            indexByLabel.set(nextField.fieldLabel, newIndex)
          }
        })
      }

      // 防御：合并后不允许出现重复字段 key（含补丁新增与已有字段冲突）
      if (errors.length === 0) {
        const finalFields = [...nextFields.filter((f) => !f.isAction), ...additions]
        const seen = new Set<string>()
        for (const f of finalFields) {
          const k = f.fieldKey.trim()
          if (!k) continue
          if (seen.has(k)) {
            errors.push(`字段 key「${k}」重复`)
            break
          }
          seen.add(k)
        }
      }

      if (errors.length > 0) {
        // 整包拒绝：不做部分回填，避免出现「一半更新一半没更新」的草稿
        return { ok: false, errors, warnings }
      }

      const actionColumns = nextFields.filter((f) => f.isAction)
      const nextConfig: PageDefinitionDTO = {
        ...base,
        ...topLevel,
        fields: [
          ...nextFields.filter((f) => !f.isAction),
          ...additions,
          ...actionColumns,
        ].map((f, i) => ({ ...f, sortOrder: i })),
      }
      const nextFieldsText = serializeFieldsText(
        nextConfig.fields,
        nextConfig.formConfig?.fieldGroups,
      )

      // 压栈前先克隆，避免后续不可变更新时旧对象被就地修改
      undoStackRef.current.push({
        config: cloneDraft(draft.config),
        fieldsText: draft.fieldsText,
      })
      while (undoStackRef.current.length > MAX_AI_UNDO) undoStackRef.current.shift()

      applyDraft(nextConfig, nextFieldsText)
      return { ok: true, errors: [], warnings, config: nextConfig }
    },
    [applyDraft],
  )

  const rollback = useCallback((): void => {
    const prev = undoStackRef.current.pop()
    if (!prev) return
    applyDraft(prev.config, prev.fieldsText)
  }, [applyDraft])

  const getContext = useCallback(() => {
    const draft = draftRef.current
    const cfg = draft.effectiveConfig
    const fields = cfg.fields.filter((f) => !f.isAction)
    return {
      sceneTitle: '页面生成器',
      schema: {
        target: 'page-generator.draft',
        hint: '返回一个补丁对象；只写草稿，不要尝试发布或删除。',
        patchTopLevelKeys: [...AI_TOP_LEVEL_KEYS],
        fieldConfigKeys: {
          fieldLabel: '中文字段名（必填）',
          fieldKey: '字段 key（英文，留空则按中文名推导）',
          fieldType: '字段类型，见 fieldTypeValues',
          width: '列宽（数字，默认 120）',
          fixed: '固定列：left / right / null',
          isFilter: '是否作为筛选条件',
          sortable: '是否支持排序',
          isRequired: '表单页是否必填',
          dbColumn: '数据库列名（留空按 key 转下划线）',
          dbType: '数据库类型，如 VARCHAR / BIGINT / DECIMAL / DATETIME',
          dbLength: '字段长度（数字）',
          options: '静态选项数组 [{ label, value }]',
        },
        fieldTypeValues: [...AI_FIELD_TYPES],
        templateTypeValues: [...AI_TEMPLATE_TYPES],
        menuLinkModeValues: ['new_child', 'bind_existing'],
      },
      values: {
        mode: draft.mode,
        pageKey: cfg.pageKey,
        pageName: cfg.pageName,
        templateType: cfg.templateType,
        tableName: cfg.tableName,
        apiPrefix: cfg.apiPrefix,
        generateMenu: cfg.generateMenu,
        menuLinkMode: cfg.menuLinkMode,
        parentMenuId: cfg.parentMenuId,
        bindMenuId: cfg.bindMenuId,
        sourceListPageKey: cfg.sourceListPageKey,
        fieldCount: fields.length,
        actionCount: cfg.fields.filter((f) => f.isAction).length,
        fields: fields.map((f) => ({
          fieldLabel: f.fieldLabel,
          fieldKey: f.fieldKey,
          fieldType: f.fieldType,
          width: f.width,
          fixed: f.fixed,
          isFilter: f.isFilter,
          sortable: f.sortable,
          isRequired: f.isRequired ?? false,
          dbColumn: f.dbColumn,
          dbType: f.dbType,
          dbLength: f.dbLength,
        })),
      },
      extra: {
        isAdvanced: draft.mode === 'advanced',
        configuredFieldCount: fields.filter((f) => f.fieldKey.trim()).length,
        totalFieldRows: draft.config.fields.length,
        formGroupCount: cfg.formConfig?.fieldGroups?.length ?? 0,
      },
    }
  }, [])

  const validateDraft = useCallback(async (): Promise<AiValidateReport> => {
    const cfg = draftRef.current.effectiveConfig
    const issues: AiValidateIssue[] = []
    const err = validateBeforeSave(cfg)
    if (err) issues.push({ level: 'error', message: err })
    const validFields = cfg.fields.filter((f) => f.fieldKey.trim())
    if (validFields.length > 0 && !validFields.some((f) => f.isFilter)) {
      issues.push({ level: 'warning', message: '当前没有字段作为筛选条件' })
    }
    if (cfg.templateType === 'form' && !validFields.some((f) => f.isRequired)) {
      issues.push({ level: 'warning', message: '表单页没有任何必填字段' })
    }
    if (cfg.menuLinkMode === 'bind_existing' && !(cfg.bindMenuId || '').trim()) {
      issues.push({ level: 'warning', message: '挂载方式为「绑定已有菜单」但未选择菜单' })
    }
    return { passed: !issues.some((i) => i.level === 'error'), issues }
  }, [validateBeforeSave])

  // 只暴露 backfill / rollback / validate；不提供 publish / delete / save
  const pageCapability = useMemo<AiPageCapability>(
    () => ({
      scene: 'page-generator',
      welcome:
        '描述你要新增或调整的页面（列表 / 详情 / 表单），我会把结果补全到当前草稿。确认后才会写入，发布仍需你手动操作。',
      getContext,
      actions: {
        backfill,
        rollback,
        validate: validateDraft,
      },
    }),
    [getContext, backfill, rollback, validateDraft],
  )

  // 页面挂载即注册能力；卸载自动注销，未注册页面自然降级为通用问答
  useEffect(() => {
    if (!capabilityKey) return
    return registerPageCapability(capabilityKey, pageCapability)
  }, [capabilityKey, pageCapability])

  // 开发环境手工验证入口：仅 vite dev 且 URL 带 ?aiDebug=1 时暴露，生产构建不生效
  useEffect(() => {
    if (!import.meta.env.DEV) return
    if (new URLSearchParams(window.location.search).get('aiDebug') !== '1') return
    const debugApi = {
      scene: 'page-generator',
      getContext,
      backfill,
      rollback,
      validate: validateDraft,
      getDraft: () => cloneDraft(draftRef.current.effectiveConfig),
    }
    const w = window as unknown as Record<string, unknown>
    w.__pageAiDebug = debugApi
    return () => {
      if (w.__pageAiDebug === debugApi) delete w.__pageAiDebug
    }
  }, [getContext, backfill, rollback, validateDraft])

  const handleSave = async (publish: boolean) => {
    // 默认模式：把文本域即时同步到 config（避免保存空数据）
    let savingConfig = config
    if (mode === 'default') {
      // 表单页识别 [分组名] 分组语法；详情页/列表页平铺
      const parsed = isForm
        ? parseFieldsTextWithGroups(fieldsText)
        : { fields: parseFieldsText(fieldsText), groups: [] as FormFieldGroupConfig[] }
      const parsedActions = parseActionsText(actionsText)
      const parsedToolbar = parseToolbarText(toolbarText)
      // 默认模式：仅当存在 actions 时才附加操作列
      const fieldsWithAction: FieldConfig[] =
        parsedActions.length > 0
          ? (() => {
              const oldActionCol =
                config.fields.find((f) => f.isAction) ??
                (() => {
                  const actionField = createEmptyField(0)
                  actionField.isAction = true
                  actionField.fieldKey = 'action'
                  actionField.fieldLabel = '操作'
                  actionField.fixed = 'right'
                  actionField.isFilter = false
                  return actionField
                })()
              oldActionCol.width = 168
              // 按中文名匹配旧字段继承扩展配置（避免默认模式保存丢失 isRequired/width 等）
              return [...mergeParsedFields(parsed.fields, config.fields), oldActionCol]
            })()
          : mergeParsedFields(parsed.fields, config.fields)
      savingConfig = {
        ...config,
        fields: fieldsWithAction.map((f, i) => ({
          ...f,
          sortOrder: i,
        })),
        actions: parsedActions.map((a, i) => ({ ...a, sortOrder: i })),
        toolbarButtons: parsedToolbar.map((b, i) => ({ ...b, sortOrder: i })),
        ...(isForm
          ? { formConfig: { ...config.formConfig, fieldGroups: parsed.groups } }
          : {}),
      }
      setConfig(savingConfig)
    }

    const err = validateBeforeSave(savingConfig)
    if (err) {
      CompanyMessage.error(err)
      return
    }
    setSaving(true)
    try {
      const payload: PageDefinitionDTO = {
        ...savingConfig,
        status: 'draft',
        // 详情页/表单页入口来自列表页跳转，不挂载菜单，跳过后端菜单联动校验
        generateMenu:
          savingConfig.templateType === 'detail' || savingConfig.templateType === 'form'
            ? false
            : savingConfig.generateMenu,
        fields: savingConfig.fields
          .filter((f) => f.fieldKey.trim())
          .map((f) => ({ ...f, dbColumn: f.dbColumn || toSnakeCase(f.fieldKey) })),
        actions: savingConfig.actions
          .filter((a) => a.actionLabel.trim())
          .map((a, i) => ({
            ...a,
            actionKey: a.actionKey.trim() || deriveKeyFromLabel(a.actionLabel, i, 'action'),
            sortOrder: i,
          })),
        toolbarButtons: (savingConfig.toolbarButtons || [])
          .filter((b) => b.btnLabel.trim() || b.btnType === 'primary')
          .map((b, i) => ({
            ...b,
            btnKey: b.btnKey.trim() || deriveKeyFromLabel(b.btnLabel, i, 'btn'),
            sortOrder: i,
          })),
      }
      const res = await savePageDefinition(payload)
      if (res.code !== 200) {
        CompanyMessage.error(res.message)
        return
      }

      // 需要发布：调 publish 接口触发后端菜单联动（菜单仅同步到当前域）
      if (publish) {
        const currentDomainId = Number(localStorage.getItem('currentDomainId') || '0') || null
        const pubRes = await publishPageDefinition(String(res.data.id), currentDomainId)
        if (pubRes.code !== 200) {
          CompanyMessage.error('发布失败：' + pubRes.message)
          return
        }
      }

      CompanyMessage.success(publish ? '已保存并发布' : '草稿已保存')
      navigate('/page-generator')
    } catch (e) {
      CompanyMessage.error('保存失败：' + String(e))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteFieldConfirm = (idx: number, label: string) => {
    modal.confirm({
      title: '删除字段',
      content: `确定删除字段「${label || '未命名'}」吗？`,
      onOk: () => removeField(idx),
    })
  }

  // 默认模式 → 高级模式：把文本域同步进 config（表单页连同 [分组名] 解析出的分组一起写入）
  const enrichForAdvanced = () => {
    setConfig((prev) => {
      const allowGroups = prev.templateType === 'form'
      const parsed = allowGroups
        ? parseFieldsTextWithGroups(fieldsText)
        : { fields: parseFieldsText(fieldsText), groups: [] as FormFieldGroupConfig[] }
      const newActions = parseActionsText(actionsText)
      const newToolbar = parseToolbarText(toolbarText)

      // 保留原 config.fields 中的操作列（isAction=true）；其余字段按中文名匹配继承旧配置
      const oldActionCol = prev.fields.find((f) => f.isAction)
      const mergedFields = [
        ...mergeParsedFields(parsed.fields, prev.fields),
        ...(oldActionCol ? [oldActionCol] : []),
      ]

      return {
        ...prev,
        fields: mergedFields.map((f, i) => ({ ...f, sortOrder: i })),
        actions: newActions.map((a, i) => ({ ...a, sortOrder: i })),
        toolbarButtons: newToolbar.map((b, i) => ({ ...b, sortOrder: i })),
        ...(allowGroups
          ? { formConfig: { ...prev.formConfig, fieldGroups: parsed.groups } }
          : {}),
      }
    })
  }

  const handleModeChange = (m: 'default' | 'advanced') => {
    if (m === 'advanced' && mode === 'default') {
      enrichForAdvanced()
    }
    // 高级 → 默认：把字段（含分组）序列化回文本域，保证分组往返不丢失
    if (m === 'default' && mode === 'advanced') {
      setFieldsText(serializeFieldsText(config.fields, config.formConfig?.fieldGroups))
    }
    setMode(m)
  }

  const handleBack = () => navigate('/page-generator')

  // antd 6 默认必填星号在 label 左侧（::before），这里改为右侧
  const requiredMark = (label: ReactNode, { required }: { required: boolean }) =>
    required ? (
      <>
        {label}&nbsp;<span style={{ color: 'var(--color-error, #ff4d4f)' }}>*</span>
      </>
    ) : (
      label
    )

  return (
    <FormPageTemplate
      title={initial ? '编辑页面配置' : '新建页面配置'}
      showBack
      onBack={handleBack}
      contentWrapped={false}
      contentStyle={{ padding: 0, overflow: 'hidden' }}
      footer={
        <div className="pgw-footer">
          <Space>
            <CompanyButton type="primary" loading={saving} onClick={() => handleSave(true)}>
              发布
            </CompanyButton>
            <CompanyButton loading={saving} onClick={() => handleSave(false)}>
              保存
            </CompanyButton>
          </Space>
        </div>
      }
    >
      <Splitter className="pgw-splitter">
        <Splitter.Panel defaultSize="50%" min="30%" max="70%">
          <div className={`pgw-editor pgw-editor--${mode}`}>
            <div className="pgw-mode-switch">
              <Radio.Group
                value={mode}
                onChange={(e) => handleModeChange(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="default">默认</Radio.Button>
                <Radio.Button value="advanced">高级</Radio.Button>
              </Radio.Group>
            </div>

            <div className="pgw-section-block">
              <SectionTitle title="基本信息" />
              <Form layout="vertical" requiredMark={requiredMark}>
            <Form.Item label="选择模板">
              <Select
                value={config.templateType}
                onChange={(v) => patchConfig({ templateType: v })}
                options={TEMPLATE_OPTIONS}
                className="pgw-select-full"
              />
            </Form.Item>
            <Form.Item label="页面名称" required>
              <Input
                value={config.pageName}
                onChange={(e) => onPageNameChange(e.target.value)}
                placeholder="如 设备管理"
              />
            </Form.Item>
            {(isDetail || isForm) && (
              <Form.Item
                label="关联列表页"
                required
                extra={
                  mode === 'default'
                    ? `${isForm ? '表单页' : '详情页'}的数据来自关联列表页同一张表，点击同步会把列表页字段名填入下方文本域`
                    : `${isForm ? '表单页' : '详情页'}的数据来自关联列表页同一张表，可一键同步字段配置`
                }
              >
                <div className="pgw-row-inline">
                  <Form.Item className="pgw-form-item-flex" style={{ flex: 1 }}>
                    <Select
                      value={config.sourceListPageKey || undefined}
                      onChange={(v: string) => {
                        const baseKey = v ?? ''
                        const detailKey = baseKey ? `${baseKey}-detail` : ''
                        patchConfig({
                          sourceListPageKey: baseKey,
                          pageKey: detailKey,
                          tableName: suggestTableName(detailKey),
                          apiPrefix: suggestApiPrefix(detailKey),
                        })
                      }}
                      placeholder="选择已发布的列表页"
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      options={publishedListPages.map((p) => ({
                        label: `${p.pageName}（${p.templateType === 'list_tree' ? '树形列表' : '基础列表'}）`,
                        value: p.pageKey,
                      }))}
                      notFoundContent={
                        publishedListPages.length === 0
                          ? '暂无已发布的列表页，请先发布一个列表页'
                          : undefined
                      }
                    />
                  </Form.Item>
                  <CompanyButton
                    loading={syncing}
                    onClick={handleSyncFieldsFromList}
                    disabled={!config.sourceListPageKey}
                  >
                    {mode === 'default' ? '同步字段名' : '从列表页同步字段'}
                  </CompanyButton>
                </div>
              </Form.Item>
            )}
            {mode === 'advanced' && (
            <>
            <Form.Item
              label="页面 key (kebab-case，作为路由和接口标识)"
              required
              extra={`将生成路由：/dynamic/${config.pageKey || '<pageKey>'}`}
            >
              <Input
                value={config.pageKey}
                onChange={(e) => onPageKeyChange(e.target.value)}
                placeholder="如 equipment-manage"
              />
            </Form.Item>
            <div className="pgw-row-inline">
              <Form.Item label="业务表名" required className="pgw-form-item-flex">
                <Input
                  value={config.tableName}
                  onChange={(e) => onTableNameChange(e.target.value)}
                  placeholder="自动生成，可改"
                />
              </Form.Item>
              <Form.Item label="API 前缀" required className="pgw-form-item-flex">
                <Input
                  value={config.apiPrefix}
                  onChange={(e) => onApiPrefixChange(e.target.value)}
                  placeholder="/api/equipments"
                />
              </Form.Item>
            </div>
            </>
            )}
          </Form>
            </div>

            {!isDetail && !isForm && (
              <div className="pgw-section-block">
                <SectionTitle title="菜单关联" />
                <Form layout="vertical" requiredMark={requiredMark}>
                <Form.Item label="挂载方式" className="pgw-form-item-compact">
                  <Radio.Group
                    value={config.menuLinkMode}
                    onChange={(e) =>
                      patchConfig({ menuLinkMode: e.target.value })
                    }
                  >
                    <Radio value="new_child">新建子菜单</Radio>
                    <Radio value="bind_existing">绑定已有菜单</Radio>
                  </Radio.Group>
                </Form.Item>
                {config.menuLinkMode === 'bind_existing' ? (
                  <Form.Item
                    label="已有菜单"
                    extra="所选菜单的 path 将被更新为 /dynamic/{pageKey}，使其指向本页面"
                    className="pgw-form-item-last"
                  >
                    <TreeSelect
                      value={config.bindMenuId ?? undefined}
                      onChange={(v: string) =>
                        patchConfig({ bindMenuId: v ?? null })
                      }
                      treeData={menuTreeDataById}
                      placeholder="选择要绑定的已有菜单"
                      allowClear
                      showSearch
                      treeNodeFilterProp="title"
                      treeDefaultExpandAll
                      className="pgw-select-full"
                    />
                  </Form.Item>
                ) : (
                  <Form.Item
                    label="父菜单"
                    extra="页面将作为所选父菜单的子节点挂载"
                    className="pgw-form-item-last"
                  >
                    <TreeSelect
                      value={config.parentMenuId ?? undefined}
                      onChange={(v: string) =>
                        patchConfig({ parentMenuId: v ?? null })
                      }
                      treeData={menuTreeDataById}
                      placeholder="选择父菜单"
                      allowClear
                      showSearch
                      treeNodeFilterProp="title"
                      treeDefaultExpandAll
                      className="pgw-select-full"
                    />
                  </Form.Item>
                )}
                </Form>
              </div>
            )}

            {isForm && (
              <div className="pgw-section-block">
                <SectionTitle title="底部按钮设置" />
                <Form layout="vertical" requiredMark={requiredMark}>
                  <div className="pgw-toolbar">
                    <span className="pgw-toolbar-count">
                      {config.formConfig.footerButtons.length > 0
                        ? `共 ${config.formConfig.footerButtons.length} 个底部按钮`
                        : '无底部按钮（页面不显示底部操作区）'}
                    </span>
                    <CompanyButton
                      type="link"
                      icon={<PlusOutlined />}
                      onClick={() =>
                        patchConfig({
                          formConfig: {
                            ...config.formConfig,
                            footerButtons: [
                              ...config.formConfig.footerButtons,
                              createEmptyFooterButton(config.formConfig.footerButtons.length),
                            ],
                          },
                        })
                      }
                    >
                      添加按钮
                    </CompanyButton>
                  </div>
                  {config.formConfig.footerButtons.map((btn, idx) => (
                    <div key={idx} className="pgw-field-item">
                      <div className="pgw-field-header">
                        <Space size={12}>
                          <span className="pgw-field-key">{btn.btnLabel || `按钮 ${idx + 1}`}</span>
                          <span className="pgw-field-label">
                            {btn.action === 'submit' ? '提交表单' : btn.action === 'save' ? '保存表单' : '返回上一页'}
                          </span>
                        </Space>
                        <Space size={4}>
                          <Button
                            type="text"
                            size="small"
                            icon={<ArrowUpOutlined />}
                            disabled={idx === 0}
                            onClick={() => {
                              const next = [...config.formConfig.footerButtons]
                              ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
                              patchConfig({
                                formConfig: {
                                  ...config.formConfig,
                                  footerButtons: next.map((b, i) => ({ ...b, sortOrder: i })),
                                },
                              })
                            }}
                          />
                          <Button
                            type="text"
                            size="small"
                            icon={<ArrowDownOutlined />}
                            disabled={idx === config.formConfig.footerButtons.length - 1}
                            onClick={() => {
                              const next = [...config.formConfig.footerButtons]
                              ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
                              patchConfig({
                                formConfig: {
                                  ...config.formConfig,
                                  footerButtons: next.map((b, i) => ({ ...b, sortOrder: i })),
                                },
                              })
                            }}
                          />
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() =>
                              patchConfig({
                                formConfig: {
                                  ...config.formConfig,
                                  footerButtons: config.formConfig.footerButtons
                                    .filter((_, i) => i !== idx)
                                    .map((b, i) => ({ ...b, sortOrder: i })),
                                },
                              })
                            }
                          />
                        </Space>
                      </div>
                      <div className="pgw-row-inline pgw-row-inline-footer">
                        <Form.Item label="按钮文案" className="pgw-form-item-flex">
                          <Input
                            value={btn.btnLabel}
                            onChange={(e) =>
                              patchConfig({
                                formConfig: {
                                  ...config.formConfig,
                                  footerButtons: config.formConfig.footerButtons.map((b, i) =>
                                    i === idx ? { ...b, btnLabel: e.target.value } : b
                                  ),
                                },
                              })
                            }
                            placeholder={btn.action === 'submit' ? '提交' : btn.action === 'save' ? '保存' : '取消'}
                          />
                        </Form.Item>
                        <Form.Item label="按钮样式" className="pgw-form-item-flex">
                          <Select
                            value={btn.btnType}
                            onChange={(v) =>
                              patchConfig({
                                formConfig: {
                                  ...config.formConfig,
                                  footerButtons: config.formConfig.footerButtons.map((b, i) =>
                                    i === idx ? { ...b, btnType: v } : b
                                  ),
                                },
                              })
                            }
                            options={[
                              { value: 'primary', label: '主按钮' },
                              { value: 'default', label: '次按钮' },
                            ]}
                          />
                        </Form.Item>
                        <Form.Item label="点击行为" className="pgw-form-item-flex pgw-form-item-last">
                          <Select
                            value={btn.action}
                            onChange={(v) =>
                              patchConfig({
                                formConfig: {
                                  ...config.formConfig,
                                  footerButtons: config.formConfig.footerButtons.map((b, i) =>
                                    i === idx
                                      ? { ...b, action: v, btnType: v === 'submit' ? 'primary' : 'default' }
                                      : b
                                  ),
                                },
                              })
                            }
                            options={[
                              { value: 'submit', label: '提交表单' },
                              { value: 'save', label: '保存表单' },
                              { value: 'cancel', label: '返回上一页' },
                            ]}
                          />
                        </Form.Item>
                      </div>
                    </div>
                  ))}
                </Form>
              </div>
            )}

            {/* 详情页：页头信息（主名称/状态标签/字段列表） */}
            {isDetail && (
              <div className="pgw-section-block">
                <SectionTitle title="页头信息" />
                {mode === 'default' ? (
                  <Form layout="vertical" requiredMark={requiredMark}>
                    <Form.Item
                      label="主名称字段名（中文名，作为详情页大标题展示）"
                    >
                      <Input
                        value={config.detailHeader.primaryNameFieldKey}
                        onChange={(e) =>
                          patchConfig({
                            detailHeader: {
                              ...config.detailHeader,
                              primaryNameFieldKey: e.target.value,
                            },
                          })
                        }
                        placeholder="如 设备名称（留空则不显示主名称）"
                      />
                    </Form.Item>
                    <Form.Item label="状态标签（每行一个标签文案，将显示在主名称右侧）">
                      <Input.TextArea
                        value={config.detailHeader.tags
                          .map((t) => t.tagText)
                          .join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean)
                          patchConfig({
                            detailHeader: {
                              ...config.detailHeader,
                              tags: lines.map((text, i) => ({
                                tagKey: deriveKeyFromLabel(text, i, 'tag'),
                                tagText: text,
                                variant: 'default' as DetailTagVariant,
                                sortOrder: i,
                              })),
                            },
                          })
                        }}
                        placeholder={'每行一个标签，例如：\n正常\nVIP\n重点客户'}
                        autoSize={{ minRows: 3 }}
                      />
                    </Form.Item>
                  </Form>
                ) : (
                  <>
                    <Form layout="vertical" requiredMark={requiredMark}>
                      <Form.Item label="主名称字段（从已配置字段中选择）">
                        <Select
                          value={config.detailHeader.primaryNameFieldKey || undefined}
                          onChange={(v: string) =>
                            patchConfig({
                              detailHeader: {
                                ...config.detailHeader,
                                primaryNameFieldKey: v ?? '',
                              },
                            })
                          }
                          placeholder="选择作为大标题展示的字段"
                          allowClear
                          showSearch
                          optionFilterProp="label"
                          options={previewConfig.fields
                            .filter((f) => f.fieldKey && !f.isAction)
                            .map((f) => ({
                              label: f.fieldLabel || f.fieldKey,
                              value: f.fieldKey,
                            }))}
                        />
                      </Form.Item>
                      <Form.Item label="显示头像占位" className="pgw-form-item-none">
                        <Radio.Group
                          value={config.detailHeader.showAvatar ? 'yes' : 'no'}
                          onChange={(e) =>
                            patchConfig({
                              detailHeader: {
                                ...config.detailHeader,
                                showAvatar: e.target.value === 'yes',
                              },
                            })
                          }
                        >
                          <Radio value="yes">显示</Radio>
                          <Radio value="no">不显示</Radio>
                        </Radio.Group>
                      </Form.Item>
                    </Form>
                    <div className="pgw-toolbar">
                      <span className="pgw-toolbar-count">
                        共 {config.detailHeader.tags.length} 个标签
                      </span>
                      <CompanyButton
                        type="link"
                        icon={<PlusOutlined />}
                        onClick={() =>
                          patchConfig({
                            detailHeader: {
                              ...config.detailHeader,
                              tags: [
                                ...config.detailHeader.tags,
                                createEmptyDetailTag(config.detailHeader.tags.length),
                              ],
                            },
                          })
                        }
                      >
                        新增标签
                      </CompanyButton>
                    </div>
                    <div className="pgw-field-list">
                    {config.detailHeader.tags.map((tag, idx) => (
                      <div key={idx} className="pgw-field-item">
                        <div className="pgw-field-header">
                          <Space size={12}>
                            <span className="pgw-field-key">
                              {tag.tagText || `标签 ${idx + 1}`}
                            </span>
                            <span className="pgw-field-label">{tag.variant}</span>
                          </Space>
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() =>
                              patchConfig({
                                detailHeader: {
                                  ...config.detailHeader,
                                  tags: config.detailHeader.tags
                                    .filter((_, i) => i !== idx)
                                    .map((t, i) => ({ ...t, sortOrder: i })),
                                },
                              })
                            }
                          />
                        </div>
                        <div className="pgw-action-row">
                          <div className="pgw-action-cell">
                            <div className="pgw-action-label">标签文案</div>
                            <Input
                              value={tag.tagText}
                              onChange={(e) => {
                                const next = [...config.detailHeader.tags]
                                next[idx] = { ...tag, tagText: e.target.value }
                                patchConfig({
                                  detailHeader: {
                                    ...config.detailHeader,
                                    tags: next,
                                  },
                                })
                              }}
                              placeholder="如 正常"
                              size="small"
                            />
                          </div>
                          <div className="pgw-action-cell">
                            <div className="pgw-action-label">颜色样式</div>
                            <Select
                              value={tag.variant}
                              onChange={(v: DetailTagVariant) => {
                                const next = [...config.detailHeader.tags]
                                next[idx] = { ...tag, variant: v }
                                patchConfig({
                                  detailHeader: {
                                    ...config.detailHeader,
                                    tags: next,
                                  },
                                })
                              }}
                              size="small"
                              options={[
                                { label: '默认(灰)', value: 'default' },
                                { label: '火山(红)', value: 'volcano' },
                                { label: '成功(绿)', value: 'success' },
                                { label: '警告(黄)', value: 'warning' },
                              ]}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {config.detailHeader.tags.length === 0 && (
                      <div className="pgw-empty">暂无标签，点击上方「新增标签」配置</div>
                    )}
                    </div>
                  </>
                )}

                {mode === 'default' ? (
                  <Form layout="vertical" requiredMark={requiredMark}>
                    <Form.Item
                      label="字段列表（每行一个字段，中文名，将作为详情页展示项）"
                      className="pgw-form-item-none"
                    >
                      <Input.TextArea
                        ref={fieldsTextRef}
                        value={fieldsText}
                        onChange={(e) => setFieldsText(e.target.value)}
                        placeholder={'每行一个字段，例如：\n设备名称\n设备编号\n所属部门\n购入日期\n当前状态\n负责人'}
                        autoSize={{ minRows: 5 }}
                      />
                    </Form.Item>
                  </Form>
                ) : (
                  <>
                    <div className="pgw-toolbar">
                      <span className="pgw-toolbar-count">共 {config.fields.length} 个字段</span>
                      <div className="pgw-toolbar-actions">
                        <CompanyButton type="link" icon={<PlusOutlined />} onClick={() => addField()}>新增字段</CompanyButton>
                      </div>
                    </div>
                    <div className="pgw-field-list">
                      {config.fields.map(renderFieldCard)}
                      {config.fields.length === 0 && (
                        <div className="pgw-empty">暂无字段，点击上方「新增字段」开始配置</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 表单页：正文信息（字段列表 + 分组配置） */}
            {isForm && (
              <div className="pgw-section-block">
                <SectionTitle title="正文信息" />
                {mode === 'default' ? (
                  <Form layout="vertical" requiredMark={requiredMark}>
                    <div className="pgw-toolbar" style={{ marginBottom: 4 }}>
                      <span className="pgw-toolbar-count">分组：单独一行写 [分组名]，其后字段归入该组</span>
                      <div className="pgw-toolbar-actions">
                        <CompanyButton type="link" icon={<PlusOutlined />} onClick={handleAddGroupMarker}>添加分组</CompanyButton>
                      </div>
                    </div>
                    {/* 表单页说明已由上方「添加分组」提示行承担，不再显示冗长 label */}
                    <Form.Item className="pgw-form-item-none">
                      <Input.TextArea
                        ref={fieldsTextRef}
                        value={fieldsText}
                        onChange={(e) => setFieldsText(e.target.value)}
                        placeholder={'每行一个字段；需要分组时单独写一行 [分组名]，例如：\n设备名称\n设备编号\n[所属信息]\n所属部门\n负责人\n[其他信息]\n购入日期\n当前状态'}
                        autoSize={{ minRows: 5 }}
                      />
                    </Form.Item>
                  </Form>
                ) : (
                  <>
                    <div className="pgw-toolbar">
                      <span className="pgw-toolbar-count">共 {config.fields.length} 个字段</span>
                      <div className="pgw-toolbar-actions">
                        <CompanyButton type="link" icon={<PlusOutlined />} onClick={() => addField()}>新增字段</CompanyButton>
                        <CompanyButton type="link" icon={<PlusOutlined />} onClick={addGroup}>新增分组</CompanyButton>
                      </div>
                    </div>
                    <div className="pgw-field-list">
                      {/* 未分组字段平铺在前（与运行时渲染顺序一致） */}
                      {formUngroupedFields.map(renderFieldCard)}
                      {config.formConfig?.fieldGroups?.map((group, gi) => {
                        const children = config.fields.filter((f) => f.groupId === group.id)
                        const groupCount = config.formConfig?.fieldGroups?.length ?? 0
                        return (
                          <div key={group.id} className="pgw-form-group-block">
                            <div className="pgw-form-group-head">
                              <Input
                                value={group.name}
                                onChange={(e) => renameGroup(group.id, e.target.value)}
                                placeholder="分组名称"
                                size="small"
                                style={{ width: 200 }}
                              />
                              <span className="pgw-form-group-count">{children.length} 个字段</span>
                              <Space size={0}>
                                <Button type="text" size="small" icon={<ArrowUpOutlined />} disabled={gi === 0} onClick={() => moveGroup(gi, -1)} />
                                <Button type="text" size="small" icon={<ArrowDownOutlined />} disabled={gi === groupCount - 1} onClick={() => moveGroup(gi, 1)} />
                                <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => removeGroup(group)} />
                              </Space>
                            </div>
                            <div className="pgw-field-list pgw-form-group-fields">
                              {children.map(renderFieldCard)}
                              {children.length === 0 && (
                                <div className="pgw-empty">暂无字段，点击下方「添加字段」放入该分组</div>
                              )}
                              <CompanyButton type="link" icon={<PlusOutlined />} onClick={() => addField(group.id)}>添加字段</CompanyButton>
                            </div>
                          </div>
                        )
                      })}
                      {config.fields.length === 0 && !config.formConfig?.fieldGroups?.length && (
                        <div className="pgw-empty">暂无字段；可先「新增分组」，再往分组里添加字段</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 详情页：正文信息（正文 Tab 配置；表单页正文固定为全部字段，无需配置 */}
            {isDetail && (
              <div className="pgw-section-block">
                <SectionTitle title="正文信息" />
                {mode === 'default' ? (
                  <Form layout="vertical" requiredMark={requiredMark}>
                    <Form.Item label="正文 Tab（每行一个 Tab 名，留空则作为单一正文区域）">
                      <Input.TextArea
                        value={config.detailHeader.tabs
                          .map((t) => t.tabLabel)
                          .join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean)
                          if (lines.length === 0) {
                            // 清空时保留一个默认正文 tab（tabLabel 为空）
                            const existing = config.detailHeader.tabs[0]
                            patchConfig({
                              detailHeader: {
                                ...config.detailHeader,
                                tabs: [existing ?? createEmptyDetailTab(0)],
                              },
                            })
                            return
                          }
                          patchConfig({
                            detailHeader: {
                              ...config.detailHeader,
                              tabs: lines.map((text, i) => ({
                                ...createEmptyDetailTab(i),
                                tabKey: deriveKeyFromLabel(text, i, 'tab'),
                                tabLabel: text,
                              })),
                            },
                          })
                        }}
                        placeholder={'留空 = 单一正文区域（内容较少时推荐）\n或每行一个 Tab，例如：\n详情\n变更记录\n操作日志'}
                        autoSize={{ minRows: 3 }}
                      />
                    </Form.Item>
                    {config.detailHeader.tabs.map((tab, idx) => {
                      const updateTab = (patch: Partial<typeof tab>) => {
                        const next = [...config.detailHeader.tabs]
                        next[idx] = { ...tab, ...patch }
                        patchConfig({
                          detailHeader: { ...config.detailHeader, tabs: next },
                        })
                      }
                      return (
                        <div key={idx} className="pgw-field-item">
                          <div className="pgw-field-header">
                            <span className="pgw-field-key">
                              {tab.tabLabel || `默认正文`}
                            </span>
                            <span className="pgw-field-label">
                              {tab.contentType === 'fields' ? '字段' : tab.contentType === 'subtable' ? '关联子表' : '时间轴/日志'}
                            </span>
                          </div>
                          <Form.Item label="内容类型" className="pgw-form-item-compact">
                            <Radio.Group
                              value={tab.contentType}
                              onChange={(e) => updateTab({ contentType: e.target.value as DetailTabContentType })}
                            >
                              <Radio value="fields">字段</Radio>
                              {!isForm && <Radio value="subtable">关联子表</Radio>}
                              {!isForm && <Radio value="timeline">时间轴/日志</Radio>}
                            </Radio.Group>
                          </Form.Item>
                          {tab.contentType === 'fields' && (
                            <>
                              {!isForm && (
                                <Form.Item label="字段分组" className="pgw-form-item-compact">
                                  <Radio.Group
                                    value={tab.fieldGroups.length > 0 ? 'grouped' : 'flat'}
                                    onChange={(e) => {
                                      if (e.target.value === 'grouped') {
                                        updateTab({ fieldGroups: [createEmptyFieldGroup(0)] })
                                      } else {
                                        // 退回扁平：分组中的字段合并回 fieldKeys
                                        const merged = [...tab.fieldKeys]
                                        tab.fieldGroups.forEach((g) => {
                                          ;(g.fieldKeys || []).forEach((k) => {
                                            if (k && !merged.includes(k)) merged.push(k)
                                          })
                                        })
                                        updateTab({ fieldKeys: merged, fieldGroups: [] })
                                      }
                                    }}
                                  >
                                    <Radio.Button value="flat">不分组</Radio.Button>
                                    <Radio.Button value="grouped">启用分组</Radio.Button>
                                  </Radio.Group>
                                </Form.Item>
                              )}
                              {tab.fieldGroups.length === 0 && (
                                <Form.Item label="信息项字段（从已配置字段中选择，展示在正文网格）" className="pgw-form-item-compact">
                                  <Select
                                    mode="multiple"
                                    value={tab.fieldKeys}
                                    onChange={(vals: string[]) => updateTab({ fieldKeys: vals })}
                                    placeholder="选择要展示的字段"
                                    allowClear
                                    showSearch
                                    optionFilterProp="label"
                                    options={previewConfig.fields
                                      .filter((f) => f.fieldKey && !f.isAction)
                                      .map((f) => ({
                                        label: f.fieldLabel || f.fieldKey,
                                        value: f.fieldKey,
                                      }))}
                                    notFoundContent={
                                      previewConfig.fields.filter((f) => f.fieldKey && !f.isAction).length === 0
                                        ? '请先在「字段配置」中添加字段'
                                        : undefined
                                    }
                                  />
                                </Form.Item>
                              )}
                              {tab.fieldGroups.length > 0 && (
                                <>
                                  {tab.fieldGroups.map((group, gi) => {
                                    const usedElsewhere = new Set<string>()
                                    tab.fieldGroups.forEach((g, i) => {
                                      if (i !== gi) (g.fieldKeys || []).forEach((k) => usedElsewhere.add(k))
                                    })
                                    return (
                                      <div key={gi} className="pgw-nested-item">
                                        <Form.Item label="分组名称" className="pgw-form-item-compact">
                                          <Space.Compact style={{ width: '100%' }}>
                                            <Input
                                              value={group.groupLabel}
                                              onChange={(e) => {
                                                const groups = [...tab.fieldGroups]
                                                groups[gi] = { ...group, groupLabel: e.target.value }
                                                updateTab({ fieldGroups: groups })
                                              }}
                                              placeholder="如 基本信息"
                                            />
                                            <Button
                                              type="text"
                                              danger
                                              icon={<DeleteOutlined />}
                                              onClick={() =>
                                                updateTab({
                                                  fieldGroups: tab.fieldGroups
                                                    .filter((_, i) => i !== gi)
                                                    .map((g, i) => ({ ...g, sortOrder: i })),
                                                })
                                              }
                                            />
                                          </Space.Compact>
                                        </Form.Item>
                                        <Form.Item label="分组字段" className="pgw-form-item-compact">
                                          <Select
                                            mode="multiple"
                                            value={group.fieldKeys}
                                            onChange={(vals: string[]) => {
                                              const groups = [...tab.fieldGroups]
                                              groups[gi] = { ...group, fieldKeys: vals }
                                              updateTab({ fieldGroups: groups })
                                            }}
                                            placeholder="选择该分组下要展示的字段"
                                            allowClear
                                            showSearch
                                            optionFilterProp="label"
                                            options={previewConfig.fields
                                              .filter((f) => f.fieldKey && !f.isAction)
                                              .map((f) => ({
                                                label: f.fieldLabel || f.fieldKey,
                                                value: f.fieldKey,
                                                disabled: usedElsewhere.has(f.fieldKey),
                                              }))}
                                            notFoundContent="没有可选字段（可能已被其他分组选中）"
                                          />
                                        </Form.Item>
                                      </div>
                                    )
                                  })}
                                  <CompanyButton
                                    type="link"
                                    size="small"
                                    icon={<PlusOutlined />}
                                    onClick={() =>
                                      updateTab({
                                        fieldGroups: [
                                          ...tab.fieldGroups,
                                          createEmptyFieldGroup(tab.fieldGroups.length),
                                        ],
                                      })
                                    }
                                  >
                                    新增分组
                                  </CompanyButton>
                                </>
                              )}
                            </>
                          )}
                          {tab.contentType === 'subtable' && (
                            <>
                              <Form.Item label="关联列表页" className="pgw-form-item-compact">
                                <Select
                                  value={tab.subTableTitle || undefined}
                                  onChange={(v: string) => updateTab({ subTableTitle: v ?? '' })}
                                  placeholder="选择关联的列表页"
                                  allowClear
                                  showSearch
                                  optionFilterProp="label"
                                  options={publishedListPages.map((p) => ({
                                    label: `${p.pageName}（${p.templateType === 'list_tree' ? '树形列表' : '基础列表'}）`,
                                    value: p.pageName,
                                  }))}
                                  notFoundContent={
                                    publishedListPages.length === 0
                                      ? '暂无已发布的列表页'
                                      : undefined
                                  }
                                />
                              </Form.Item>
                              <Form.Item label="子表列名（每行一个）" className="pgw-form-item-compact">
                                <Input.TextArea
                                  value={tab.subTableColumns.map((c) => c.colLabel).join('\n')}
                                  onChange={(e) => {
                                    const lines = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean)
                                    updateTab({
                                      subTableColumns: lines.map((label, i) => ({
                                        colKey: deriveKeyFromLabel(label, i, 'col'),
                                        colLabel: label,
                                        sortOrder: i,
                                      })),
                                    })
                                  }}
                                  placeholder={'每行一个列名，例如：\n名称\n状态\n操作时间'}
                                  autoSize={{ minRows: 3 }}
                                />
                              </Form.Item>
                            </>
                          )}
                          {tab.contentType === 'timeline' && (
                            <Form.Item
                              label="日志示例（每行一条，格式：时间 内容）"
                              className="pgw-form-item-compact"
                            >
                              <Input.TextArea
                                value={tab.timelineItems.map((it) => `${it.time} ${it.content}`).join('\n')}
                                onChange={(e) => {
                                  const lines = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean)
                                  updateTab({
                                    timelineItems: lines.map((line, i) => {
                                      const [time, ...rest] = line.split(/\s+/)
                                      return { time, content: rest.join(' '), sortOrder: i }
                                    }),
                                  })
                                }}
                                placeholder={'每行一条，例如：\n2026-07-27 创建\n2026-07-28 更新状态'}
                                autoSize={{ minRows: 3 }}
                              />
                            </Form.Item>
                          )}
                        </div>
                      )
                    })}
                  </Form>
                ) : (
                  <>
                    <div className="pgw-toolbar">
                      <span className="pgw-toolbar-count">
                        共 {config.detailHeader.tabs.length} 个 Tab
                      </span>
                      <CompanyButton
                        type="link"
                        icon={<PlusOutlined />}
                        onClick={() =>
                          patchConfig({
                            detailHeader: {
                              ...config.detailHeader,
                              tabs: [
                                ...config.detailHeader.tabs,
                                createEmptyDetailTab(config.detailHeader.tabs.length),
                              ],
                            },
                          })
                        }
                      >
                        新增 Tab
                      </CompanyButton>
                    </div>
                    {config.detailHeader.tabs.map((tab, idx) => {
                      const updateTab = (patch: Partial<typeof tab>) => {
                        const next = [...config.detailHeader.tabs]
                        next[idx] = { ...tab, ...patch }
                        patchConfig({
                          detailHeader: { ...config.detailHeader, tabs: next },
                        })
                      }
                      return (
                      <div key={idx} className="pgw-field-item">
                        <div className="pgw-field-header">
                          <Space size={12}>
                            <span className="pgw-field-key">
                              {tab.tabLabel || `默认正文`}
                            </span>
                            <span className="pgw-field-label">
                              {tab.contentType === 'fields' ? '字段' : tab.contentType === 'subtable' ? '关联子表' : '时间轴/日志'}
                            </span>
                          </Space>
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() =>
                              patchConfig({
                                detailHeader: {
                                  ...config.detailHeader,
                                  tabs: config.detailHeader.tabs
                                    .filter((_, i) => i !== idx)
                                    .map((t, i) => ({ ...t, sortOrder: i })),
                                },
                              })
                            }
                          />
                        </div>
                        <div className="pgw-action-row">
                          <div className="pgw-action-cell">
                            <div className="pgw-action-label">Tab 名称</div>
                            <Input
                              value={tab.tabLabel}
                              onChange={(e) => updateTab({ tabLabel: e.target.value })}
                              placeholder="如 变更记录"
                              size="small"
                            />
                          </div>
                          <div className="pgw-action-cell">
                            <div className="pgw-action-label">内容类型</div>
                            <Select
                              value={tab.contentType}
                              onChange={(v: DetailTabContentType) => updateTab({ contentType: v })}
                              size="small"
                              options={[
                                { label: '字段', value: 'fields' },
                                ...(!isForm ? [
                                  { label: '关联子表', value: 'subtable' },
                                  { label: '时间轴/日志', value: 'timeline' },
                                ] : []),
                              ]}
                            />
                          </div>
                        </div>

                        {tab.contentType === 'fields' && (
                          <>
                            {!isForm && (
                              <div className="pgw-action-row">
                                <div className="pgw-action-cell" style={{ width: '100%' }}>
                                  <div className="pgw-action-label">字段分组</div>
                                  <Radio.Group
                                    value={tab.fieldGroups.length > 0 ? 'grouped' : 'flat'}
                                    onChange={(e) => {
                                      if (e.target.value === 'grouped') {
                                        updateTab({ fieldGroups: [createEmptyFieldGroup(0)] })
                                      } else {
                                        // 退回扁平：分组中的字段合并回 fieldKeys
                                        const merged = [...tab.fieldKeys]
                                        tab.fieldGroups.forEach((g) => {
                                          ;(g.fieldKeys || []).forEach((k) => {
                                            if (k && !merged.includes(k)) merged.push(k)
                                          })
                                        })
                                        updateTab({ fieldKeys: merged, fieldGroups: [] })
                                      }
                                    }}
                                    size="small"
                                  >
                                    <Radio.Button value="flat">不分组</Radio.Button>
                                    <Radio.Button value="grouped">启用分组</Radio.Button>
                                  </Radio.Group>
                                </div>
                              </div>
                            )}
                            {tab.fieldGroups.length === 0 && (
                              <div className="pgw-action-row">
                                <div className="pgw-action-cell" style={{ width: '100%' }}>
                                  <div className="pgw-action-label">信息项字段</div>
                                  <Select
                                    mode="multiple"
                                    value={tab.fieldKeys}
                                    onChange={(vals: string[]) => updateTab({ fieldKeys: vals })}
                                    placeholder="选择要展示的字段"
                                    allowClear
                                    showSearch
                                    optionFilterProp="label"
                                    size="small"
                                    style={{ width: '100%' }}
                                    options={config.fields
                                      .filter((f) => f.fieldKey && !f.isAction)
                                      .map((f) => ({
                                        label: f.fieldLabel || f.fieldKey,
                                        value: f.fieldKey,
                                      }))}
                                    notFoundContent={
                                      config.fields.filter((f) => f.fieldKey && !f.isAction).length === 0
                                        ? '请先添加字段'
                                        : undefined
                                    }
                                  />
                                </div>
                              </div>
                            )}
                            {tab.fieldGroups.length > 0 && (
                              <>
                                {tab.fieldGroups.map((group, gi) => {
                                  const usedElsewhere = new Set<string>()
                                  tab.fieldGroups.forEach((g, i) => {
                                    if (i !== gi) (g.fieldKeys || []).forEach((k) => usedElsewhere.add(k))
                                  })
                                  return (
                                    <div key={gi} className="pgw-nested-item">
                                      <div className="pgw-action-row">
                                        <div className="pgw-action-cell">
                                          <div className="pgw-action-label">分组名称</div>
                                          <Input
                                            value={group.groupLabel}
                                            onChange={(e) => {
                                              const groups = [...tab.fieldGroups]
                                              groups[gi] = { ...group, groupLabel: e.target.value }
                                              updateTab({ fieldGroups: groups })
                                            }}
                                            placeholder="如 基本信息"
                                            size="small"
                                          />
                                        </div>
                                        <Button
                                          type="text"
                                          size="small"
                                          danger
                                          icon={<DeleteOutlined />}
                                          onClick={() =>
                                            updateTab({
                                              fieldGroups: tab.fieldGroups
                                                .filter((_, i) => i !== gi)
                                                .map((g, i) => ({ ...g, sortOrder: i })),
                                            })
                                          }
                                        />
                                      </div>
                                      <div className="pgw-action-row pgw-action-row--fields">
                                        <div className="pgw-action-cell" style={{ width: '100%' }}>
                                          <div className="pgw-action-label">分组字段</div>
                                          <Select
                                            mode="multiple"
                                            value={group.fieldKeys}
                                            onChange={(vals: string[]) => {
                                              const groups = [...tab.fieldGroups]
                                              groups[gi] = { ...group, fieldKeys: vals }
                                              updateTab({ fieldGroups: groups })
                                            }}
                                            placeholder="选择该分组下要展示的字段"
                                            allowClear
                                            showSearch
                                            optionFilterProp="label"
                                            size="small"
                                            style={{ width: '100%' }}
                                            options={config.fields
                                              .filter((f) => f.fieldKey && !f.isAction)
                                              .map((f) => ({
                                                label: f.fieldLabel || f.fieldKey,
                                                value: f.fieldKey,
                                                disabled: usedElsewhere.has(f.fieldKey),
                                              }))}
                                            notFoundContent="没有可选字段（可能已被其他分组选中）"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                                <div className="pgw-group-add-row">
                                  <CompanyButton
                                    type="link"
                                    size="small"
                                    icon={<PlusOutlined />}
                                    onClick={() =>
                                      updateTab({
                                        fieldGroups: [
                                          ...tab.fieldGroups,
                                          createEmptyFieldGroup(tab.fieldGroups.length),
                                        ],
                                      })
                                    }
                                  >
                                    新增分组
                                  </CompanyButton>
                                </div>
                              </>
                            )}
                          </>
                        )}

                        {tab.contentType === 'subtable' && (
                          <>
                            <div className="pgw-action-row">
                              <div className="pgw-action-cell">
                                <div className="pgw-action-label">子表标题</div>
                                <Input
                                  value={tab.subTableTitle}
                                  onChange={(e) => updateTab({ subTableTitle: e.target.value })}
                                  placeholder="如 操作记录"
                                  size="small"
                                />
                              </div>
                              <div className="pgw-action-cell" style={{ maxWidth: 160 }}>
                                <div className="pgw-action-label">列数（留空自动）</div>
                                <CompanyButton
                                  size="small"
                                  onClick={() =>
                                    updateTab({
                                      subTableColumns: [
                                        ...tab.subTableColumns,
                                        { colKey: '', colLabel: '', sortOrder: tab.subTableColumns.length },
                                      ],
                                    })
                                  }
                                >
                                  新增列
                                </CompanyButton>
                              </div>
                            </div>
                            {tab.subTableColumns.map((col, ci) => (
                              <div key={ci} className="pgw-action-row">
                                <div className="pgw-action-cell">
                                  <Input
                                    value={col.colLabel}
                                    onChange={(e) => {
                                      const cols = [...tab.subTableColumns]
                                      cols[ci] = { ...col, colLabel: e.target.value }
                                      updateTab({ subTableColumns: cols })
                                    }}
                                    placeholder="列名"
                                    size="small"
                                  />
                                </div>
                                <Button
                                  type="text"
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() =>
                                    updateTab({
                                      subTableColumns: tab.subTableColumns
                                        .filter((_, i) => i !== ci)
                                        .map((c, i) => ({ ...c, sortOrder: i })),
                                    })
                                  }
                                />
                              </div>
                            ))}
                          </>
                        )}

                        {tab.contentType === 'timeline' && (
                          <div className="pgw-tab-timeline">
                            <div style={{ marginBottom: 4 }} className="pgw-action-label">日志示例条目（运行时从接口取真实数据）</div>
                            <Input.TextArea
                              value={tab.timelineItems.map((it) => `${it.time} ${it.content}`).join('\n')}
                              onChange={(e) => {
                                const lines = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean)
                                updateTab({
                                  timelineItems: lines.map((line, i) => {
                                    const [time, ...rest] = line.split(/\s+/)
                                    return { time, content: rest.join(' '), sortOrder: i }
                                  }),
                                })
                              }}
                              placeholder={'每行一条，格式：时间 内容\n2026-07-27 创建\n2026-07-28 更新状态'}
                              autoSize={{ minRows: 3 }}
                            />
                          </div>
                        )}
                      </div>
                      )
                    })}
                    {config.detailHeader.tabs.length === 0 && (
                      <div className="pgw-empty">
                        <div style={{ marginBottom: 8 }}>暂无正文配置</div>
                        <Space size={8}>
                          <CompanyButton
                            size="small"
                            onClick={() =>
                              patchConfig({
                                detailHeader: {
                                  ...config.detailHeader,
                                  tabs: [
                                    ...config.detailHeader.tabs,
                                    createEmptyDetailTab(config.detailHeader.tabs.length),
                                  ],
                                },
                              })
                            }
                          >
                            配置默认正文
                          </CompanyButton>
                          <CompanyButton
                            size="small"
                            onClick={() =>
                              patchConfig({
                                detailHeader: {
                                  ...config.detailHeader,
                                  tabs: [
                                    ...config.detailHeader.tabs,
                                    { ...createEmptyDetailTab(config.detailHeader.tabs.length), tabLabel: '详情' },
                                  ],
                                },
                              })
                            }
                          >
                            添加 Tab
                          </CompanyButton>
                        </Space>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* 列表页：独立的字段配置 section */}
            {!isDetail && !isForm && (
            <div className="pgw-section-block">
              <SectionTitle title="字段配置" />
              {mode === 'default' ? (
                <Form layout="vertical" requiredMark={requiredMark}>
                  <Form.Item
                    label="字段列表（每行一个字段，中文名）"
                    className="pgw-form-item-none"
                  >
                    <Input.TextArea
                      value={fieldsText}
                      onChange={(e) => setFieldsText(e.target.value)}
                      placeholder={'每行一个字段，例如：\n任务名称\n负责人\n状态\n创建时间'}
                      autoSize={{ minRows: 5 }}
                    />
                  </Form.Item>
                </Form>
              ) : (
                <>
                  <div className="pgw-toolbar">
                    <span className="pgw-toolbar-count">共 {config.fields.length} 个字段</span>
                    <div className="pgw-toolbar-actions">
                      <CompanyButton type="link" icon={<PlusOutlined />} onClick={() => addField()}>新增字段</CompanyButton>
                    </div>
                  </div>
                  <div className="pgw-field-list">
                    {config.fields.map((field, idx) => (
                      <FieldCard
                        key={idx}
                        value={field}
                        onChange={(f) => updateField(idx, f)}
                        index={idx}
                        onDelete={() => handleDeleteFieldConfirm(idx, field.fieldLabel)}
                      />
                    ))}
                    {config.fields.length === 0 && (
                      <div className="pgw-empty">暂无字段，点击上方「新增字段」开始配置</div>
                    )}
                  </div>
                </>
              )}
            </div>
            )}

            {!isDetail && !isForm && (
            <>
            <div className="pgw-section-block">
              <SectionTitle title="操作列按钮" />
              {mode === 'default' ? (
                <Form layout="vertical" requiredMark={requiredMark}>
                  <Form.Item
                    label="按钮列表（每行一个按钮名，识别「详情/编辑/删除」，其他为自定义）"
                    className="pgw-form-item-none"
                  >
                    <Input.TextArea
                      value={actionsText}
                      onChange={(e) => setActionsText(e.target.value)}
                      placeholder={'每行一个按钮，例如：\n详情\n编辑\n删除\n导出'}
                      autoSize={{ minRows: 4 }}
                    />
                  </Form.Item>
                </Form>
              ) : (
                <>
              <div className="pgw-toolbar">
                <span className="pgw-toolbar-count">
                  共 {config.actions.length} 个操作列按钮
                </span>
                <div className="pgw-toolbar-actions">
                  <CompanyButton type="link" icon={<PlusOutlined />} onClick={addAction}>
                    新增按钮
                  </CompanyButton>
                </div>
            </div>
            {config.actions.map((action, idx) => (
              <div key={idx} className="pgw-field-item">
                <div className="pgw-field-header">
                  <Space size={12}>
                    <span className="pgw-field-key">
                      {action.actionLabel || `操作列按钮 ${idx + 1}`}
                    </span>
                    <span className="pgw-field-label">
                      {ACTION_TYPE_OPTIONS.find((o) => o.value === action.actionType)?.label || action.actionType}
                    </span>
                  </Space>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeAction(idx)}
                  />
                </div>
                <div className="pgw-action-row">
                  <div className="pgw-action-cell">
                    <div className="pgw-action-label">按钮文案</div>
                    <Input
                      value={action.actionLabel}
                      onChange={(e) =>
                        updateAction(idx, { ...action, actionLabel: e.target.value })
                      }
                      placeholder="如 详情"
                      size="small"
                    />
                  </div>
                  <div className="pgw-action-cell">
                    <div className="pgw-action-label">类型</div>
                    <Select
                      value={action.actionType}
                      onChange={(v: ActionType) => updateAction(idx, { ...action, actionType: v })}
                      options={ACTION_TYPE_OPTIONS}
                      size="small"
                    />
                  </div>
                  <div className="pgw-action-cell">
                    <div className="pgw-action-label">二次确认</div>
                    <Select
                      value={action.needConfirm ? 'yes' : 'no'}
                      onChange={(v) => updateAction(idx, { ...action, needConfirm: v === 'yes' })}
                      options={[
                        { label: '是', value: 'yes' },
                        { label: '否', value: 'no' },
                      ]}
                      size="small"
                    />
                  </div>
                  <div className="pgw-action-cell">
                    <div className="pgw-action-label">显示条件（可选）</div>
                    <Input
                      value={action.conditionExpr}
                      onChange={(e) =>
                        updateAction(idx, { ...action, conditionExpr: e.target.value })
                      }
                      placeholder="如 status === 'published'"
                      size="small"
                    />
                  </div>
                </div>
              </div>
            ))}
            {config.actions.length === 0 && (
              <div className="pgw-empty">
                暂无操作列按钮（需要先在「字段配置」中添加一个操作列）
              </div>
            )}
                </>
            )}
            </div>

            <div className="pgw-section-block">
              <SectionTitle title="工具栏按钮" />
              {mode === 'default' ? (
                <Form layout="vertical" requiredMark={requiredMark}>
                  <Form.Item
                    label="工具栏按钮列表（每行一个按钮名，第一行识别为主按钮「新增」）"
                    className="pgw-form-item-none"
                  >
                    <Input.TextArea
                      value={toolbarText}
                      onChange={(e) => setToolbarText(e.target.value)}
                      placeholder={'每行一个按钮，例如：\n新增\n导出\n批量删除'}
                      autoSize={{ minRows: 3 }}
                    />
                  </Form.Item>
                </Form>
              ) : (
                <>
              <div className="pgw-toolbar">
                <span className="pgw-toolbar-count">
                  共 {config.toolbarButtons?.length || 0} 个工具栏按钮
                </span>
                <div className="pgw-toolbar-actions">
                  <CompanyButton type="link" icon={<PlusOutlined />} onClick={addToolbarButton}>
                    新增按钮
                  </CompanyButton>
                </div>
              </div>
              {(config.toolbarButtons || []).map((btn, idx) => (
                <div key={idx} className="pgw-field-item">
                  <div className="pgw-field-header">
                    <Space size={12}>
                      <span className="pgw-field-key">
                        {btn.btnLabel || `工具栏按钮 ${idx + 1}`}
                      </span>
                      <span className="pgw-field-label">
                        {btn.btnType === 'primary' ? '主按钮' : '次按钮'}
                      </span>
                    </Space>
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeToolbarButton(idx)}
                    />
                  </div>
                  <div className="pgw-action-row">
                    <div className="pgw-action-cell">
                      <div className="pgw-action-label">按钮文案</div>
                      <Input
                        value={btn.btnLabel}
                        onChange={(e) =>
                          updateToolbarButton(idx, { ...btn, btnLabel: e.target.value })
                        }
                        placeholder="如 新增"
                        size="small"
                      />
                    </div>
                    <div className="pgw-action-cell">
                      <div className="pgw-action-label">类型</div>
                      <Select
                        value={btn.btnType}
                        onChange={(v: ToolbarButtonType) =>
                          updateToolbarButton(idx, { ...btn, btnType: v })
                        }
                        options={[
                          { label: '主按钮', value: 'primary' },
                          { label: '次按钮', value: 'default' },
                        ]}
                        size="small"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(config.toolbarButtons || []).length === 0 && (
                <div className="pgw-empty">
                  暂无工具栏按钮（页面将不显示顶部操作区）
                </div>
              )}
                </>
              )}
            </div>
            </>
            )}
          </div>
        </Splitter.Panel>

        <Splitter.Panel>
          <div className="pgw-preview">
            <div className="pgw-preview-title">
              <SectionTitle title="实时预览" />
            </div>
            <PreviewPanel config={previewConfig} />
          </div>
        </Splitter.Panel>
      </Splitter>
    </FormPageTemplate>
  )
}
