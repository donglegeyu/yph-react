import { useMemo } from 'react'
import { Tag, Space, App } from 'antd'
import { CompanyButton, CompanyMessage, SmartListTemplate, ActionCell } from '@donglegeyu/company-ui'
import type { FieldDefinition, ColumnField } from '@donglegeyu/company-ui'
import type { PageDefinitionDTO, FieldConfig } from '../types'
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

    if (field.isStatusTag) {
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

  const toolbarActions = (
    <Space size={12}>
      <CompanyButton type="primary" onClick={() => CompanyMessage.info('新增（演示）')}>
        新增
      </CompanyButton>
    </Space>
  )

  return (
    <div className="pgw-preview-wrap">
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
    </div>
  )
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
