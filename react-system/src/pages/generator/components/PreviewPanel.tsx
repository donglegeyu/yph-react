import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Tag, Space, App, Table, Timeline } from 'antd'
import {
  CompanyButton,
  CompanyMessage,
  SmartListTemplate,
  ActionCell,
  DetailPageTemplate,
  FormPageTemplate,
  BaseInfoForm,
  SectionTitle,
} from '@donglegeyu/company-ui'
import type {
  FieldDefinition,
  ColumnField,
  DetailFieldItem,
  DetailTagItem,
  DetailTabItem,
  FormField,
  FormFieldItem,
  FormValues,
} from '@donglegeyu/company-ui'
import type { PageDefinitionDTO, FieldConfig, DetailTabConfig } from '../types'
import { createEmptyFormPage, normalizeFormFieldGroups } from '../types'
import { buildMockRecords, buildTreeMockRecords, resolveMockOptions } from '../services'

interface Props {
  config: PageDefinitionDTO
}

export default function PreviewPanel({ config }: Props) {
  const { modal } = App.useApp()

  const sortedFields = useMemo(
    () => [...config.fields].sort((a, b) => a.sortOrder - b.sortOrder),
    [config.fields],
  )

  const isDetail = config.templateType === 'detail'
  const isForm = config.templateType === 'form'
  // 表单页模板配置（老数据兜底默认值）
  const formCfg = config.formConfig ?? createEmptyFormPage()

  // 表单页：预览表单值（BaseInfoForm 受控）
  const [previewValues, setPreviewValues] = useState<FormValues>({})

  // 表单页：按字段配置渲染表单控件（fieldType 即控件类型）
  const formFields = useMemo(
    () => sortedFields.filter((f) => f.fieldKey && !f.isAction),
    [sortedFields],
  )

  // 表单页：字段配置 → BaseInfoForm 字段定义（与运行时 DynamicFormPage 映射一致），按 fieldGroups 聚合为 section 小节
  const previewFormFields = useMemo<FormField[]>(() => {
    // 旧 groupName 数据迁移为一等分组结构（field.groupId + formConfig.fieldGroups）
    const { fields: normFields, formConfig } = normalizeFormFieldGroups({
      fields: formFields,
      formConfig: config.formConfig,
    })
    const groups = formConfig?.fieldGroups ?? []
    const defs = normFields.map((f) => toPreviewFormField(f))
    const groupIds = new Set(groups.map((g) => g.id))
    const out: FormField[] = []
    // 未分组字段平铺在前（与配置界面顺序一致）
    normFields.forEach((f, i) => {
      if (!f.groupId || !groupIds.has(f.groupId)) out.push(defs[i])
    })
    // 分组小节按 fieldGroups 数组顺序，组内字段按字段顺序（BaseInfoForm section，与 FormPageTemplate 分组示例一致）
    groups.forEach((g) => {
      const children = normFields
        .map((f, i) => (f.groupId === g.id ? defs[i] : null))
        .filter((d): d is FormFieldItem => d !== null)
      if (children.length) {
        out.push({ type: 'section', label: g.name.trim() || '未命名分组', children })
      }
    })
    return out
  }, [formFields, config.formConfig])

  const fieldDefs: FieldDefinition[] = useMemo(
    () => sortedFields.map(toFieldDefinition),
    [sortedFields],
  )

  const columnFields: ColumnField[] = useMemo(
    () =>
      sortedFields.map((f) => ({
        key: f.fieldKey,
        label: f.fieldLabel,
        visible: true,
        width: f.width,
        fixed: f.fixed ?? undefined,
      })),
    [sortedFields],
  )

  const mockData = useMemo(() => {
    const validFields = sortedFields.filter((f) => f.fieldKey && !f.isAction)
    if (config.treeConfig.enabled) {
      return buildTreeMockRecords(validFields)
    }
    return buildMockRecords(validFields, 8)
  }, [sortedFields, config.treeConfig.enabled])

  // 详情页：取第一条 mock 记录作为展示数据
  const detailRecord = useMemo<Record<string, unknown>>(() => {
    const validFields = sortedFields.filter((f) => f.fieldKey && !f.isAction)
    if (validFields.length === 0) return {}
    return buildMockRecords(validFields, 1)[0] ?? {}
  }, [sortedFields])

  // 详情页：把字段配置映射为 DetailFieldItem[]
  const detailInfoFields = useMemo<DetailFieldItem[]>(() => {
    const validFields = sortedFields.filter((f) => f.fieldKey && !f.isAction)
    return validFields.map((field) => ({
      label: field.fieldLabel || field.fieldKey,
      value: renderDetailValue(field, detailRecord[field.fieldKey]),
    }))
  }, [sortedFields, detailRecord])

  // 详情页头部：主名称（从字段值取，取不到用配置的字段名兜底，都没配置用占位）
  const detailPrimaryName = useMemo<string>(() => {
    const key = config.detailHeader?.primaryNameFieldKey
    if (!key) return '主名称占位'
    const val = detailRecord[key]
    if (val != null && val !== '') return String(val)
    return key
  }, [config.detailHeader, detailRecord])

  // 详情页头部：头像（用 primaryName 首字母，参考真实详情页实践）
  const detailAvatar = useMemo<string | undefined>(() => {
    if (!config.detailHeader?.showAvatar) return undefined
    return (detailPrimaryName || '?').charAt(0)
  }, [config.detailHeader, detailPrimaryName])

  // 详情页头部：标签
  const detailTags = useMemo<DetailTagItem[]>(() => {
    return (config.detailHeader?.tags || [])
      .filter((t) => t.tagText.trim())
      .map((t) => ({ text: t.tagText, variant: t.variant }))
  }, [config.detailHeader])

  // 详情页正文：按 contentType 渲染每个 Tab 的内容
  const [detailActiveTab, setDetailActiveTab] = useState('')
  const renderTabContent = (tab: DetailTabConfig): ReactNode => {
    const emptyHint = (text: string) => (
      <div style={{
        padding: '40px 0',
        textAlign: 'center',
        color: '#bbb',
        fontSize: 13,
        background: '#fafafa',
        borderRadius: 4,
        border: '1px dashed #e0e0e0',
      }}>
        {text}
      </div>
    )

    if (tab.contentType === 'fields') {
      const fieldMap = new Map(config.fields.map((f) => [f.fieldKey, f]))
      // 渲染单个字段网格（扁平字段列表）
      const renderFieldGrid = (keys: string[]) => (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '8px 32px',
        }}>
          {keys.map((key, i) => {
            const field = fieldMap.get(key)
            const label = field?.fieldLabel || key
            return (
              <div key={i} style={{ display: 'flex', lineHeight: '22px' }}>
                <span style={{ color: 'rgba(0,0,0,0.45)', whiteSpace: 'nowrap' }}>{label}：</span>
                <span style={{ color: 'rgba(0,0,0,0.88)', wordBreak: 'break-all' }}>
                  {field ? renderDetailValue(field, detailRecord[key]) : '-'}
                </span>
              </div>
            )
          })}
        </div>
      )

      // 优先走分组模式：Tab → Groups → Fields
      const validGroups = tab.fieldGroups.filter(
        (g) => g.groupLabel.trim() || g.fieldKeys.some((k) => k.trim())
      )
      if (validGroups.length > 0) {
        return (
          <div style={{ padding: '16px 0' }}>
            {validGroups.map((group, gi) => {
              const keys = group.fieldKeys.filter((k) => k.trim())
              return (
                <div key={gi} style={{ marginBottom: gi < validGroups.length - 1 ? 24 : 0 }}>
                  <SectionTitle title={group.groupLabel || `分组 ${gi + 1}`} />
                  {keys.length === 0 ? (
                    emptyHint('该分组暂无字段，请在配置中选择')
                  ) : (
                    renderFieldGrid(keys)
                  )}
                </div>
              )
            })}
          </div>
        )
      }

      // 退回扁平模式
      const keys = tab.fieldKeys.filter((k) => k.trim())
      if (keys.length === 0) {
        return emptyHint('暂无信息项，请在配置中选择字段')
      }
      return (
        <div style={{ padding: '16px 0' }}>
          {renderFieldGrid(keys)}
        </div>
      )
    }
    if (tab.contentType === 'subtable') {
      const cols = tab.subTableColumns.filter((c) => c.colLabel.trim())
      if (cols.length === 0) {
        return emptyHint('暂无子表列，请在配置中添加列')
      }
      const columns = cols.map((c) => ({
        title: c.colLabel,
        dataIndex: c.colKey || c.colLabel,
        key: c.colKey || c.colLabel,
      }))
      const mockRows = Array.from({ length: 3 }, (_, i) => {
        const row: Record<string, unknown> = { key: i }
        columns.forEach((col) => { row[col.dataIndex] = `数据${i + 1}` })
        return row
      })
      return (
        <div style={{ padding: '16px 0' }}>
          {tab.subTableTitle && (
            <div style={{ fontWeight: 500, marginBottom: 8 }}>{tab.subTableTitle}</div>
          )}
          <Table
            columns={columns}
            dataSource={mockRows}
            pagination={false}
            size="small"
            bordered
          />
        </div>
      )
    }
    // timeline
    const items = tab.timelineItems.filter((it) => it.content.trim())
    if (items.length === 0) {
      return emptyHint('暂无日志记录')
    }
    return (
      <div style={{ padding: '16px 0' }}>
        <Timeline
          items={items.map((it) => ({
            children: (
              <>
                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{it.time}</div>
                <div>{it.content}</div>
              </>
            ),
          }))}
        />
      </div>
    )
  }
  const detailTabs = useMemo<DetailTabItem[]>(() => {
    return (config.detailHeader?.tabs || [])
      .filter((t) => t.tabLabel.trim())
      .map((t, idx) => ({
        key: t.tabKey || `tab-${idx}`,
        label: t.tabLabel,
        children: renderTabContent(t),
      }))
  }, [config.detailHeader, sortedFields, detailRecord])

  // 默认正文：tabLabel 为空的 tab 作为单一正文区域（无 Tab 头）
  const defaultContent = useMemo<ReactNode>(() => {
    const defaultTabs = (config.detailHeader?.tabs || []).filter((t) => !t.tabLabel.trim())
    if (defaultTabs.length === 0) return null
    return (
      <div style={{ margin: '16px 0 0' }}>
        {defaultTabs.map((t, idx) => <div key={`default-${idx}`}>{renderTabContent(t)}</div>)}
      </div>
    )
  }, [config.detailHeader, sortedFields, detailRecord])

  const activeTab = detailTabs.length > 0
    ? (detailActiveTab || detailTabs[0].key)
    : undefined

  // 详情页标题栏：操作按钮（titleActions）
  const detailTitleActions = useMemo<ReactNode>(() => {
    const btns = (config.detailHeader?.titleActions || [])
      .filter((b) => b.btnLabel.trim())
    if (btns.length === 0) return undefined
    return (
      <Space size={8}>
        {btns.map((b, i) => (
          <CompanyButton
            key={`${b.btnKey}-${i}`}
            type={b.btnType === 'primary' ? 'primary' : 'default'}
            onClick={() => CompanyMessage.info(`${b.btnLabel}（演示）`)}
          >
            {b.btnLabel}
          </CompanyButton>
        ))}
      </Space>
    )
  }, [config.detailHeader])

  const bodyCell = (column: Record<string, unknown>, record: Record<string, unknown>) => {
    const fieldKey = column.key as string
    const field = sortedFields.find((f) => f.fieldKey === fieldKey)
    if (!field) return null

    const raw = record[fieldKey]

    if (field.isAction) {
      const buttons = config.actions
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((act) => ({
          key: act.actionKey,
          label: act.actionLabel,
          danger: act.actionType === 'delete',
          onClick: () => {
            if (act.needConfirm) {
              modal.confirm({
                title: `确认${act.actionLabel}`,
                content: `是否对该记录执行「${act.actionLabel}」操作？`,
                onOk: () => CompanyMessage.success(`${act.actionLabel}（演示）`),
              })
            } else {
              CompanyMessage.info(`${act.actionLabel}（演示）`)
            }
          },
        }))
      return <ActionCell buttons={buttons} />
    }

    if (field.fieldType === 'status' || field.isStatusTag) {
      const statusValue = String(raw ?? '')
      const matched = field.statusMap.find((s) => s.value === statusValue)
      if (matched) {
        return <Tag color={matched.color}>{matched.text}</Tag>
      }
      return <span>{raw != null && raw !== '' ? String(raw) : '-'}</span>
    }

    const dsFieldTypes = ['select', 'select-multi', 'radio', 'cascader']
    if (dsFieldTypes.includes(field.fieldType)) {
      const options = resolveMockOptions(field)
      const opt = options.find((o) => String(o.value) === String(raw))
      return <span>{opt?.label ?? (raw != null && raw !== '' ? String(raw) : '-')}</span>
    }

    return <span>{raw != null && raw !== '' ? String(raw) : '-'}</span>
  }

  const toolbarButtons = (config.toolbarButtons || [])
    .filter((b) => b.btnKey.trim() || b.btnLabel.trim() || b.btnType === 'primary')
    .map((b) => ({
      ...b,
      btnKey: b.btnKey.trim() || (b.btnType === 'primary' ? 'primary' : ''),
      btnLabel: b.btnLabel.trim() || '未命名',
    }))
  const toolbarActions =
    toolbarButtons.length > 0 ? (
      <Space size={12}>
        {toolbarButtons.map((b, i) => (
          <CompanyButton
            key={`${b.btnKey}-${i}`}
            type={b.btnType === 'primary' ? 'primary' : 'default'}
            onClick={() =>
              CompanyMessage.info(b.tooltip || `${b.btnLabel}（演示）`)
            }
          >
            {b.btnLabel}
          </CompanyButton>
        ))}
      </Space>
    ) : null

  return (
    <div className="pgw-preview-wrap">
      {isForm ? (
        <FormPageTemplate
          title={`${config.pageName || '未命名页面'}（预览）`}
          showBack
          onBack={() => undefined}
          showFooter={formCfg.footerButtons.length > 0}
          footerPosition="fixed"
          // 分组（section）在最上面时保持组件默认上边距 8px；否则加大到 24px
          contentStyle={previewFormFields[0]?.type === 'section' ? undefined : { paddingTop: 24 }}
          footer={
            formCfg.footerButtons.length > 0 ? (
              <div className="form-footer-actions">
                <Space>
                  {formCfg.footerButtons.map((btn, i) => (
                    <CompanyButton
                      key={btn.btnKey || i}
                      type={btn.btnType === 'primary' ? 'primary' : 'default'}
                      onClick={() =>
                        CompanyMessage.info(btn.action === 'submit' ? '提交（演示）' : btn.action === 'save' ? '保存（演示）' : '返回（演示）')
                      }
                    >
                      {btn.btnLabel || (btn.action === 'submit' ? '提交' : btn.action === 'save' ? '保存' : '取消')}
                    </CompanyButton>
                  ))}
                </Space>
              </div>
            ) : undefined
          }
        >
          {formFields.length === 0 ? (
            <div style={{
              padding: '24px 0',
              textAlign: 'center',
              color: '#bbb',
              fontSize: 13,
              background: '#fafafa',
              borderRadius: 4,
              border: '1px dashed #e0e0e0',
            }}>
              表单项区域（添加字段后此处展示表单控件）
            </div>
          ) : (
            <BaseInfoForm
              value={previewValues}
              fields={previewFormFields}
              onChange={setPreviewValues}
            />
          )}
        </FormPageTemplate>
      ) : isDetail ? (
        <DetailPageTemplate
          title={`${config.pageName || '未命名页面'}（预览）`}
          showBack
          onBack={() => undefined}
          titleActions={detailTitleActions}
          avatar={detailAvatar}
          primaryName={detailPrimaryName}
          tags={detailTags.length > 0 ? detailTags : undefined}
          infoFields={detailInfoFields}
          infoColumns={2}
          showDivider
          infoArea={
            detailInfoFields.length === 0 ? (
              <div style={{ padding: '8px 0', color: '#bbb', fontSize: 13 }}>
                字段信息区（添加字段后此处展示详情字段）
              </div>
            ) : undefined
          }
          tabs={detailTabs.length > 0 ? detailTabs : undefined}
          activeTab={activeTab}
          onTabChange={setDetailActiveTab}
        >
          {defaultContent ?? (
            <div style={{
              margin: '16px 0 0',
              padding: '40px 0',
              textAlign: 'center',
              color: '#bbb',
              fontSize: 13,
              background: '#fafafa',
              borderRadius: 4,
              border: '1px dashed #e0e0e0',
            }}>
              正文内容区域（配置正文后将在预览中展示）
            </div>
          )}
        </DetailPageTemplate>
      ) : (
        <SmartListTemplate
          title={`${config.pageName || '未命名页面'}（预览）`}
          fields={fieldDefs}
          dataSource={mockData}
          loading={false}
          pagination={
            config.treeConfig.enabled
              ? false
              : { current: 1, pageSize: 20, total: mockData.length }
          }
          rowKey="id"
          defaultExpandAll={config.treeConfig.enabled}
          treeConfig={
            config.treeConfig.enabled
              ? {
                  enabled: true,
                  expandColumnKey: config.treeConfig.expandColumnKey || 'name',
                  childrenColumnName: config.treeConfig.childrenColumnName || 'children',
                  levelIndent: config.treeConfig.levelIndent ?? 24,
                }
              : undefined
          }
          columnFields={columnFields}
          defaultColumnFields={columnFields}
          onSearch={() => CompanyMessage.info('搜索（演示）')}
          onReset={() => CompanyMessage.info('重置（演示）')}
          toolbarActions={toolbarActions}
          bodyCell={bodyCell}
        />
      )}
    </div>
  )
}

// 详情页字段值渲染：与列表 bodyCell 保持一致的展示逻辑（状态/选项/原始值）
function renderDetailValue(field: FieldConfig, raw: unknown): ReactNode {
  if (raw === null || raw === undefined || raw === '') return '-'

  if (field.fieldType === 'status' || field.isStatusTag) {
    const matched = field.statusMap.find((s) => s.value === String(raw))
    if (matched) {
      return <Tag color={matched.color}>{matched.text}</Tag>
    }
    return String(raw)
  }

  const dsFieldTypes = ['select', 'select-multi', 'radio', 'cascader']
  if (dsFieldTypes.includes(field.fieldType)) {
    const options = resolveMockOptions(field)
    const opt = options.find((o) => String(o.value) === String(raw))
    return opt?.label ?? String(raw)
  }

  if (field.fieldType === 'daterange' && Array.isArray(raw)) {
    return (raw as unknown[]).join(' ~ ')
  }

  return String(raw)
}

// 表单页：字段配置 → BaseInfoForm 字段定义（预览与运行时共用映射规则）
function toPreviewFormField(field: FieldConfig): FormFieldItem {
  const base = { name: field.fieldKey, label: field.fieldLabel || field.fieldKey }
  const dsFieldTypes = ['select', 'select-multi', 'radio', 'cascader']
  const options = dsFieldTypes.includes(field.fieldType) ? resolveMockOptions(field) : undefined
  switch (field.fieldType) {
    case 'number':
      return { ...base, type: 'input-number', placeholder: '请输入' }
    case 'select':
      return { ...base, type: 'select', placeholder: '请选择', options }
    case 'select-multi':
      return { ...base, type: 'select-multi', placeholder: '请选择', options }
    case 'radio':
      return { ...base, type: 'radio', options }
    case 'cascader':
      return { ...base, type: 'cascader', placeholder: '请选择', options }
    case 'date':
      return { ...base, type: 'date', placeholder: '请选择' }
    case 'daterange':
      return { ...base, type: 'daterange' }
    case 'status':
      return {
        ...base,
        type: 'select',
        placeholder: '请选择',
        options: field.statusMap.map((s) => ({ label: s.text, value: s.value })),
      }
    default:
      return { ...base, type: 'input', placeholder: '请输入' }
  }
}

function toFieldDefinition(field: FieldConfig): FieldDefinition {
  const def: FieldDefinition = {
    key: field.fieldKey,
    label: field.fieldLabel,
    type: mapFieldType(field.fieldType),
    width: field.width,
    fixed: field.fixed ?? undefined,
    hideInFilter: !field.isFilter,
  }
  const dsFieldTypes = ['select', 'select-multi', 'radio', 'cascader']
  if (dsFieldTypes.includes(field.fieldType)) {
    const options = resolveMockOptions(field)
    if (options.length > 0) {
      def.options = [{ label: '全部', value: '' }, ...options]
    }
  }
  return def
}

function mapFieldType(t: string): FieldDefinition['type'] {
  if (t === 'number') return 'input'
  if (t === 'date') return 'date'
  if (t === 'daterange') return 'daterange'
  if (t === 'select' || t === 'select-multi' || t === 'radio' || t === 'cascader') return 'select'
  return 'input'
}
