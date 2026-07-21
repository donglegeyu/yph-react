import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Select, TreeSelect, Button, Space, App, Radio, Splitter } from 'antd'
import { CompanyButton, CompanyMessage, SectionTitle, FormPageTemplate } from '@donglegeyu/company-ui'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import type { PageDefinitionDTO, FieldConfig, ActionConfig, ActionType } from './types'
import {
  createEmptyField,
  createEmptyAction,
  createEmptyPage,
  toSnakeCase,
  ACTION_TYPE_OPTIONS,
} from './types'
import { savePageDefinition, publishPageDefinition, suggestTableName, suggestApiPrefix, suggestFromChinese, suggestFieldKey } from './services'
import { API_ENDPOINTS } from '@/constants/api'
import FieldEditor from './components/FieldEditor'
import PreviewPanel from './components/PreviewPanel'
import './PageGeneratorWizard.scss'

// 后端 nav_menu 返回结构（带数字 id）
interface NavMenuWithId {
  id: number
  key: string
  label: string
  parentId: number | null
  status?: number
  deleted?: number
  children?: NavMenuWithId[] | null
}

const TEMPLATE_OPTIONS = [
  { label: '列表页（基础）', value: 'list_basic' },
  { label: '列表页（树形）', value: 'list_tree' },
  { label: '详情页', value: 'detail' },
]

interface Props {
  initial?: PageDefinitionDTO | null
}

// 默认模式文本域 → 完整 FieldConfig[]
function parseFieldsText(text: string): FieldConfig[] {
  const labels = text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  return labels.map((label, idx) => {
    const fieldKey = suggestFieldKey(label)
    return {
      ...createEmptyField(idx),
      fieldLabel: label,
      fieldKey,
      dbColumn: toSnakeCase(fieldKey),
    }
  })
}

// 默认模式文本域 → 完整 ActionConfig[]
function parseActionsText(text: string): ActionConfig[] {
  const lines = text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  let customCounter = 0
  return lines.map((label, idx) => {
    let actionType: ActionType = 'custom'
    if (label === '详情') actionType = 'detail'
    else if (label === '编辑') actionType = 'edit'
    else if (label === '删除') actionType = 'delete'
    const actionKey =
      actionType === 'custom' ? `custom${++customCounter}` : actionType
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

export default function PageGeneratorWizard({ initial }: Props) {
  const navigate = useNavigate()
  const { modal } = App.useApp()
  const [config, setConfig] = useState<PageDefinitionDTO>(initial ?? createEmptyPage())
  const [saving, setSaving] = useState(false)
  const [keyTouched, setKeyTouched] = useState(false)
  const [mode, setMode] = useState<'default' | 'advanced'>('default')
  // 从后端拉取的 nav_menu 列表（带数字 id，用于菜单关联选择）
  const [navMenus, setNavMenus] = useState<NavMenuWithId[]>([])

  useEffect(() => {
    let cancelled = false
    fetch(API_ENDPOINTS.NAV_MENUS)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return
        if (json.code === 200 && Array.isArray(json.data)) {
          setNavMenus(json.data as NavMenuWithId[])
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])
  // 默认模式文本域：字段/操作按钮，每行一项
  const [fieldsText, setFieldsText] = useState(() =>
    (initial?.fields ?? [])
      .filter((f) => !f.isAction)
      .map((f) => f.fieldLabel)
      .filter(Boolean)
      .join('\n'),
  )
  const [actionsText, setActionsText] = useState(() =>
    (initial?.actions ?? [])
      .map((a) => a.actionLabel)
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
    const parsedFields = parseFieldsText(fieldsText)
    const parsedActions = parseActionsText(actionsText)
    // 仅当存在 actions 时才附加操作列
    const fieldsWithAction =
      parsedActions.length > 0 ? ensureActionColumn(parsedFields) : parsedFields
    return {
      ...config,
      fields: fieldsWithAction.map((f, i) => ({
        ...f,
        sortOrder: i,
      })),
      actions: parsedActions.map((a, i) => ({ ...a, sortOrder: i })),
    }
  }, [mode, config, fieldsText, actionsText])

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

  const addField = () => {
    const next = createEmptyField(config.fields.length)
    setConfig((prev) => ({ ...prev, fields: [...prev.fields, next] }))
  }

  const updateField = (idx: number, field: FieldConfig) => {
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) => (i === idx ? field : f)),
    }))
  }

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

  const validateBeforeSave = (cfg: PageDefinitionDTO): string | null => {
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
  }

  const handleSave = async (publish: boolean) => {
    // 默认模式：把文本域即时同步到 config（避免保存空数据）
    let savingConfig = config
    if (mode === 'default') {
      const parsedFields = parseFieldsText(fieldsText)
      const parsedActions = parseActionsText(actionsText)
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
              return [...parsedFields, oldActionCol]
            })()
          : parsedFields
      savingConfig = {
        ...config,
        fields: fieldsWithAction.map((f, i) => ({
          ...f,
          sortOrder: i,
        })),
        actions: parsedActions.map((a, i) => ({ ...a, sortOrder: i })),
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
        fields: savingConfig.fields
          .filter((f) => f.fieldKey.trim())
          .map((f) => ({ ...f, dbColumn: f.dbColumn || toSnakeCase(f.fieldKey) })),
        actions: savingConfig.actions.filter((a) => a.actionKey.trim()),
      }
      const res = await savePageDefinition(payload)
      if (res.code !== 200) {
        CompanyMessage.error(res.message)
        return
      }

      // 需要发布：调 publish 接口触发后端菜单联动
      if (publish) {
        const pubRes = await publishPageDefinition(String(res.data.id))
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

  // 默认模式 → 高级模式：把文本域同步进 config
  const enrichForAdvanced = () => {
    setConfig((prev) => {
      const newFields = parseFieldsText(fieldsText)
      const newActions = parseActionsText(actionsText)

      // 保留原 config.fields 中的操作列（isAction=true）
      const oldActionCol = prev.fields.find((f) => f.isAction)
      const mergedFields = [
        ...newFields,
        ...(oldActionCol ? [oldActionCol] : []),
      ]

      return {
        ...prev,
        fields: mergedFields.map((f, i) => ({ ...f, sortOrder: i })),
        actions: newActions.map((a, i) => ({ ...a, sortOrder: i })),
      }
    })
  }

  const handleModeChange = (m: 'default' | 'advanced') => {
    if (m === 'advanced' && mode === 'default') {
      enrichForAdvanced()
    }
    setMode(m)
  }

  const handleBack = () => navigate('/page-generator')

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
          <div className="pgw-editor">
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
              <Form layout="vertical">
            <Form.Item label="选择模板">
              <Select
                value={config.templateType}
                onChange={(v) => patchConfig({ templateType: v })}
                options={TEMPLATE_OPTIONS}
                className="pgw-select-full"
              />
            </Form.Item>
            <Form.Item label="页面名称" required className="pgw-form-item-none">
              <Input
                value={config.pageName}
                onChange={(e) => onPageNameChange(e.target.value)}
                placeholder="如 设备管理"
              />
            </Form.Item>
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

            <div className="pgw-section-block">
              <SectionTitle title="菜单关联" />
              <Form layout="vertical">
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

            <div className="pgw-section-block">
              <SectionTitle title="字段配置" />
              {mode === 'default' ? (
                <Form layout="vertical">
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
                <CompanyButton type="primary" icon={<PlusOutlined />} onClick={addField}>
                  新增字段
                </CompanyButton>
                <span className="pgw-toolbar-count">
                  共 {config.fields.length} 个字段
                </span>
              </div>
            <div className="pgw-field-list">
              {config.fields.map((field, idx) => (
                <div key={idx} className="pgw-field-item">
                  <div className="pgw-field-header">
                    <Space size={12}>
                      <span className="pgw-field-key">
                        {field.fieldKey || `字段 ${idx + 1}`}
                      </span>
                      <span className="pgw-field-label">
                        {field.fieldLabel || '未命名'}
                      </span>
                      {field.isAction && (
                        <span className="pgw-tag-action">操作列</span>
                      )}
                      {field.isStatusTag && (
                        <span className="pgw-tag-status">状态列</span>
                      )}
                    </Space>
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteFieldConfirm(idx, field.fieldLabel)}
                    />
                  </div>
                  <FieldEditor value={field} onChange={(f) => updateField(idx, f)} />
                </div>
              ))}
              {config.fields.length === 0 && (
                <div className="pgw-empty">
                  暂无字段，点击上方「新增字段」开始配置
                </div>
              )}
            </div>
                </>
              )}
            </div>

            <div className="pgw-section-block">
              <SectionTitle title="操作按钮" />
              {mode === 'default' ? (
                <Form layout="vertical">
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
                <CompanyButton type="primary" icon={<PlusOutlined />} onClick={addAction}>
                  新增操作按钮
                </CompanyButton>
                <span className="pgw-toolbar-count">
                  共 {config.actions.length} 个操作按钮
                </span>
            </div>
            {config.actions.map((action, idx) => (
              <div key={idx} className="pgw-action-row">
                <div className="pgw-action-cell">
                  <div className="pgw-action-label">按钮 key</div>
                  <Input
                    value={action.actionKey}
                    onChange={(e) =>
                      updateAction(idx, { ...action, actionKey: e.target.value })
                    }
                    placeholder="如 detail"
                    size="small"
                  />
                </div>
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
                <div className="pgw-action-cell pgw-action-cell-delete">
                  <div className="pgw-action-label">&nbsp;</div>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeAction(idx)}
                    size="small"
                  />
                </div>
              </div>
            ))}
            {config.actions.length === 0 && (
              <div className="pgw-empty">
                暂无操作按钮（需要先在「字段配置」中添加一个操作列）
              </div>
            )}
                </>
            )}
            </div>
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
