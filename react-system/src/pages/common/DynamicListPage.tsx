import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Tag, Space, App, Spin, Empty } from 'antd'
import {
  CompanyButton,
  CompanyMessage,
  SmartListTemplate,
  ActionCell,
  type FieldDefinition,
  type ColumnField,
} from '@donglegeyu/company-ui'
import type { PageSchemaVO, FieldConfig } from '@/pages/generator/types'
import { getPageSchemaByPageKey, buildMockRecords, buildTreeMockRecords } from '@/pages/generator/services'
import PageErrorBoundary from '@/components/PageErrorBoundary'

export default function DynamicListPage() {
  const { pageKey = '' } = useParams()
  const { modal } = App.useApp()
  const [schema, setSchema] = useState<PageSchemaVO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterParams, setFilterParams] = useState<Record<string, unknown>>({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getPageSchemaByPageKey(pageKey)
      .then((res) => {
        if (cancelled) return
        if (res.code === 200 && res.data) {
          setSchema(res.data)
          if (res.data.pageName) {
            document.title = `${res.data.pageName} - 逸品汇`
          }
        } else {
          setError('未找到该页面配置')
        }
      })
      .catch((e) => {
        if (!cancelled) setError('加载失败：' + String(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [pageKey])

  const sortedFields = useMemo(
    () => (schema ? [...schema.fields].sort((a, b) => a.sortOrder - b.sortOrder) : []),
    [schema],
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
    if (!schema) return []
    const validFields = sortedFields.filter((f) => f.fieldKey && !f.isAction)
    if (schema.treeConfig.enabled) {
      return buildTreeMockRecords(validFields)
    }
    return buildMockRecords(validFields, 20)
  }, [schema, sortedFields])

  const bodyCell = useCallback(
    (column: Record<string, unknown>, record: Record<string, unknown>) => {
      if (!schema) return null
      const fieldKey = column.key as string
      const field = sortedFields.find((f) => f.fieldKey === fieldKey)
      if (!field) return null

      const raw = record[fieldKey]

      if (field.isAction && schema.actions.length > 0) {
        const buttons = schema.actions
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
                  onOk: () => CompanyMessage.success(`${act.actionLabel} 已执行`),
                })
              } else {
                CompanyMessage.info(`${act.actionLabel}`)
              }
            },
          }))
        return <ActionCell buttons={buttons} />
      }

      if (field.isStatusTag) {
        const matched = field.statusMap.find((s) => s.value === String(raw ?? ''))
        if (matched) {
          return <Tag color={matched.color}>{matched.text}</Tag>
        }
      }

      if (field.fieldType === 'select') {
        const opt = field.options.find((o) => String(o.value) === String(raw))
        if (opt) return <span>{opt.label}</span>
      }

      return <span>{raw != null && raw !== '' ? String(raw) : '-'}</span>
    },
    [schema, sortedFields, modal],
  )

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (error || !schema) {
    return (
      <div style={{ padding: 48 }}>
        <Empty description={error || '未找到页面配置'}>
          <CompanyButton type="primary" onClick={() => window.history.back()}>
            返回
          </CompanyButton>
        </Empty>
      </div>
    )
  }

  const toolbarActions = (
    <Space size={12}>
      <CompanyButton type="primary" onClick={() => CompanyMessage.info('新增功能待接入后端')}>
        新增
      </CompanyButton>
    </Space>
  )

  return (
    <PageErrorBoundary>
      <SmartListTemplate
        title={schema.pageName}
        fields={fieldDefs}
        dataSource={mockData as unknown as Record<string, unknown>[]}
        loading={false}
        pagination={
          schema.treeConfig.enabled
            ? false
            : { current: 1, pageSize: 20, total: mockData.length }
        }
        rowKey="id"
        defaultExpandAll={schema.treeConfig.enabled}
        treeConfig={
          schema.treeConfig.enabled
            ? {
                enabled: true,
                expandColumnKey: schema.treeConfig.expandColumnKey || 'name',
                childrenColumnName: schema.treeConfig.childrenColumnName || 'children',
                levelIndent: schema.treeConfig.levelIndent ?? 24,
              }
            : undefined
        }
        filterParams={filterParams}
        onFilterParamsChange={setFilterParams}
        onSearch={(data) => setFilterParams(data)}
        onReset={() => setFilterParams({})}
        columnFields={columnFields}
        defaultColumnFields={columnFields}
        onColumnSettingsChange={() => undefined}
        onColumnSettingsReset={() => undefined}
        toolbarActions={toolbarActions}
        bodyCell={bodyCell}
      />
    </PageErrorBoundary>
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
  if (field.fieldType === 'select' && field.options.length > 0) {
    def.options = [{ label: '全部', value: '' }, ...field.options]
  }
  return def
}

function mapFieldType(t: string): FieldDefinition['type'] {
  if (t === 'number') return 'input'
  if (t === 'date') return 'date'
  if (t === 'daterange') return 'daterange'
  if (t === 'select') return 'select'
  return 'input'
}
