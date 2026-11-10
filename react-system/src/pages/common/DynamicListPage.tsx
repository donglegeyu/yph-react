import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
import {
  getPageSchemaByPageKey,
  buildMockRecords,
  buildTreeMockRecords,
  fetchDynamicQuery,
  buildFilterString,
  buildColumnKeyMap,
  mapRecordToFront,
  deleteDynamicRecord,
} from '@/pages/generator/services'
import PageErrorBoundary from '@/components/PageErrorBoundary'

export default function DynamicListPage() {
  const { pageKey = '' } = useParams()
  const navigate = useNavigate()
  const { modal } = App.useApp()
  const [schema, setSchema] = useState<PageSchemaVO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterParams, setFilterParams] = useState<Record<string, unknown>>({})
  // 真实业务数据
  const [records, setRecords] = useState<Record<string, unknown>[]>([])
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  // 是否回退到 mock（当 tableName 为空或接口报错时）
  const [useMockFallback, setUseMockFallback] = useState(false)
  // 数据表尚未建表（后端报「表不存在」）：显示引导空态，不回退 mock
  const [tableMissing, setTableMissing] = useState(false)
  // 删除成功后触发列表刷新（不重置筛选/分页）
  const [refreshTick, setRefreshTick] = useState(0)
  // 列头排序状态（fieldKey + 方向；null 表示未排序）
  const [sortState, setSortState] = useState<{ field: string; dir: 'asc' | 'desc' } | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setUseMockFallback(false)
    setTableMissing(false)
    getPageSchemaByPageKey(pageKey)
      .then((res) => {
        if (cancelled) return
        if (res.code === 200 && res.data) {
          setSchema(res.data)
          if (res.data.pageName) {
            document.title = `${res.data.pageName} - 逸品汇`
          }
          // 没有 tableName 或树形模式 → 直接走 mock 兜底
          if (!res.data.tableName || res.data.treeConfig.enabled) {
            setUseMockFallback(true)
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

  // mock 数据兜底（仅 tableName 为空 或 树形模式 或 接口失败时）
  const mockData = useMemo(() => {
    if (!schema) return []
    const validFields = sortedFields.filter((f) => f.fieldKey && !f.isAction)
    if (schema.treeConfig.enabled) {
      return buildTreeMockRecords(validFields)
    }
    return buildMockRecords(validFields, 20)
  }, [schema, sortedFields])

  // fieldKey → dbColumn 映射（表列名 snake_case 与字段 key camelCase 的转换）
  const columnKeyMap = useMemo(() => buildColumnKeyMap(sortedFields), [sortedFields])

  // 真实数据拉取：当 schema 加载完 + 非 mock 模式时，按分页/筛选拉数据
  useEffect(() => {
    if (!schema || useMockFallback || !schema.tableName) return
    let cancelled = false

    const validFields = sortedFields.filter((f) => f.fieldKey && !f.isAction)
    const validFieldKeys = validFields.map((f) => f.fieldKey)
    // 日期范围字段 → between 操作符
    const rangeFieldKeys = validFields
      .filter((f) => f.fieldType === 'daterange')
      .map((f) => f.fieldKey)
    const filter = buildFilterString(filterParams, validFieldKeys, columnKeyMap, rangeFieldKeys)
    // 排序：fieldKey → dbColumn，格式 field:dir（后端 buildOrderByClause 解析）
    const orderBy = sortState
      ? `${columnKeyMap[sortState.field] || sortState.field}:${sortState.dir}`
      : undefined

    setLoading(true)
    fetchDynamicQuery({
      table: schema.tableName,
      current,
      size: pageSize,
      filter: filter || undefined,
      orderBy,
    })
      .then((res) => {
        if (cancelled) return
        if (res.code === 200 && res.data) {
          // 后端记录 key 是 dbColumn（snake_case）→ 转成 fieldKey 供表格渲染
          setRecords((res.data.records || []).map((r) => mapRecordToFront(r, columnKeyMap)))
          setTotal(res.data.total || 0)
        } else {
          // 数据表还没建（建表脚本未放入/后端未重启）→ 显示引导空态，不回退 mock
          if (res.message && res.message.includes('表不存在')) {
            setTableMissing(true)
          } else {
            // 其他接口报错 → 回退 mock
            CompanyMessage.warning('业务数据接口暂不可用，已切换为演示数据')
            setUseMockFallback(true)
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUseMockFallback(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [schema, useMockFallback, current, pageSize, filterParams, sortedFields, columnKeyMap, sortState, refreshTick])

  const dataSource = useMockFallback ? mockData : records

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
            onClick: () => {
              if (act.actionType === 'detail') {
                const detailKey = schema.sourceListPageKey
                  ? `${schema.sourceListPageKey}-detail`
                  : `${pageKey}-detail`
                navigate(`/dynamic/detail/${detailKey}/${record.id}`)
                return
              }
              if (act.actionType === 'edit') {
                navigate(`/dynamic/form/${pageKey}/${record.id}`)
                return
              }
              if (act.actionType === 'delete') {
                if (useMockFallback || !schema.tableName) {
                  CompanyMessage.info('演示数据，完成建表后才能删除')
                  return
                }
                modal.confirm({
                  title: `确认${act.actionLabel}`,
                  content: '删除后不可恢复，是否继续？',
                  onOk: async () => {
                    const res = await deleteDynamicRecord(
                      schema.tableName,
                      record.id as string | number,
                    )
                    if (res.code === 200) {
                      CompanyMessage.success('删除成功')
                      // 当前页只剩这一条且不在第一页 → 回退一页；否则刷新当前页
                      if (records.length === 1 && current > 1) {
                        setCurrent((c) => c - 1)
                      } else {
                        setRefreshTick((t) => t + 1)
                      }
                    } else {
                      CompanyMessage.error(res.message || '删除失败')
                    }
                  },
                })
                return
              }
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

      if (field.fieldType === 'status' || field.isStatusTag) {
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
    [schema, sortedFields, modal, records, current, useMockFallback, pageKey, navigate],
  )

  if (loading && !schema) {
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

  // 数据表尚未初始化：提示去页面生成器处理建表脚本
  if (tableMissing) {
    return (
      <div style={{ padding: 48 }}>
        <Empty description="数据表尚未初始化">
          <div
            style={{
              maxWidth: 480,
              margin: '0 auto 16px',
              textAlign: 'left',
              color: '#888',
              lineHeight: 1.8,
            }}
          >
            <p>该页面对应的数据表还没有在数据库中创建（建表脚本尚未放入后端项目）。</p>
            <p>
              处理方式：到「页面生成器」点页面标题右侧的「建表脚本」按钮，用「一键放入项目目录」把脚本放进后端
              migration 目录，然后重启后端即可自动建表。
            </p>
          </div>
          <CompanyButton type="primary" onClick={() => navigate('/page-generator')}>
            去页面生成器
          </CompanyButton>
        </Empty>
      </div>
    )
  }

  const toolbarButtons = (schema?.toolbarButtons || [])
    .filter((b) => b.btnKey.trim() || b.btnLabel.trim() || b.btnType === 'primary')
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const toolbarActions =
    toolbarButtons.length > 0 ? (
      <Space size={12}>
        {toolbarButtons.map((b, i) => (
          <CompanyButton
            key={`${b.btnKey}-${i}`}
            type={b.btnType === 'primary' ? 'primary' : 'default'}
            onClick={() => {
              // 新增类按钮 → 跳转动态表单页（若已配置表单模板则渲染配置，否则走默认表单）
              if (['新增', '新建', '添加'].includes(b.btnLabel)) {
                navigate(`/dynamic/form/${pageKey}`)
                return
              }
              CompanyMessage.info(b.tooltip || `${b.btnLabel}功能待接入后端`)
            }}
          >
            {b.btnLabel}
          </CompanyButton>
        ))}
      </Space>
    ) : undefined

  return (
    <PageErrorBoundary>
      <SmartListTemplate
        title={schema.pageName}
        fields={fieldDefs}
        dataSource={dataSource as unknown as Record<string, unknown>[]}
        loading={loading}
        pagination={
          schema.treeConfig.enabled || useMockFallback
            ? { current: 1, pageSize: 20, total: dataSource.length }
            : { current, pageSize, total }
        }
        onPaginationChange={({ current: page, pageSize: size }) => {
          setCurrent(page)
          if (size) setPageSize(size)
        }}
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
        onSearch={(data) => {
          setFilterParams(data)
          setCurrent(1)
        }}
        onReset={() => {
          setFilterParams({})
          setCurrent(1)
        }}
        onChange={(data) => {
          // 表头排序回调（SmartListTemplate 内部 Table onChange 转发 { sortField, sortOrder }）
          // FilterForm 的筛选数据不含 sortOrder，以此区分
          if ('sortOrder' in data) {
            const order = data.sortOrder as 'ascend' | 'descend' | undefined
            setSortState(
              order && data.sortField
                ? { field: String(data.sortField), dir: order === 'ascend' ? 'asc' : 'desc' }
                : null,
            )
          }
        }}
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
    sortable: field.sortable === true,
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

