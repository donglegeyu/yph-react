import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Tag, Space, App, Table, Timeline } from 'antd'
import {
  CompanyButton,
  CompanyMessage,
  SmartListTemplate,
  ActionCell,
  DetailPageTemplate,
} from '@donglegeyu/company-ui'
import type { FieldDefinition, ColumnField, DetailFieldItem, DetailTagItem, DetailTabItem } from '@donglegeyu/company-ui'
import type { PageDefinitionDTO, FieldConfig, DetailTabConfig } from '../types'
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
    if (tab.contentType === 'fields') {
      const labels = tab.fieldKeys.filter((k) => k.trim())
      if (labels.length === 0) {
        return <div style={{ padding: '16px 0', color: '#999', fontSize: 13 }}>暂无信息项，请在左侧配置标签</div>
      }
      const cols = tab.fieldColumns || 2
      const gapPct = 100 / cols
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 32px', padding: '16px 0' }}>
          {labels.map((label, i) => (
            <div key={i} style={{ display: 'flex', lineHeight: '22px', width: `calc(${gapPct}% - 32px)` }}>
              <span style={{ color: 'rgba(0,0,0,0.45)', whiteSpace: 'nowrap' }}>{label}：</span>
              <span style={{ color: 'rgba(0,0,0,0.88)', wordBreak: 'break-all' }}>示例值</span>
            </div>
          ))}
        </div>
      )
    }
    if (tab.contentType === 'subtable') {
      const cols = tab.subTableColumns.filter((c) => c.colLabel.trim())
      const columns = (cols.length > 0 ? cols : [{ colKey: 'col1', colLabel: '示例列' }]).map((c) => ({
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
      return <div style={{ padding: '16px 0', color: '#999', fontSize: 13 }}>暂无日志示例</div>
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
      {isDetail ? (
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
          <div style={{ padding: '16px 0', color: '#999', fontSize: 13 }}>
            {detailInfoFields.length === 0
              ? '请在左侧添加字段后，上方将展示详情字段'
              : '详情页正文区域（关联数据、操作日志、子表等内容将在此展示）'}
          </div>
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
