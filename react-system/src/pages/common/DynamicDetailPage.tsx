import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Tag, Space, Spin, Empty, Table, Timeline } from 'antd'
import {
  CompanyButton,
  CompanyMessage,
  DetailPageTemplate,
  SectionTitle,
  type DetailFieldItem,
  type DetailTagItem,
  type DetailTabItem,
} from '@donglegeyu/company-ui'
import type { ReactNode } from 'react'
import type { PageSchemaVO, FieldConfig, DetailTabConfig } from '@/pages/generator/types'
import {
  getPageSchemaByPageKey,
  fetchDynamicQuery,
  buildMockRecords,
  resolveMockOptions,
  buildColumnKeyMap,
  mapRecordToFront,
} from '@/pages/generator/services'
import PageErrorBoundary from '@/components/PageErrorBoundary'

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

function DynamicDetailPageInner() {
  const { pageKey = '', id = '' } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [schema, setSchema] = useState<PageSchemaVO | null>(null)
  const [record, setRecord] = useState<Record<string, unknown>>({})
  const [error, setError] = useState<string | null>(null)

  // 返回逻辑：预览模式回 page-generator；列表跳转回对应的列表页；history 兜底
  const handleBack = () => {
    if (id === 'preview') {
      navigate('/page-generator')
      return
    }
    const listPageKey = pageKey.replace(/-detail$/, '')
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(`/dynamic/${listPageKey}`)
    }
  }

  useEffect(() => {
    setLoading(true)
    setError(null)
    getPageSchemaByPageKey(pageKey)
      .then((res) => {
        if (res.code === 200 && res.data) {
          setSchema(res.data)
        } else {
          setError('未找到该页面配置')
        }
      })
      .catch(() => setError('加载页面配置失败'))
      .finally(() => setLoading(false))
  }, [pageKey])

  const sortedFields = useMemo(
    () => [...(schema?.fields || [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [schema],
  )

  // fieldKey → dbColumn 映射（后端记录 key 转换用）
  const columnKeyMap = useMemo(() => buildColumnKeyMap(sortedFields), [sortedFields])

  useEffect(() => {
    if (!schema) return
    const validFields = sortedFields.filter((f) => f.fieldKey && !f.isAction)
    // 预览模式（id='preview'）或无 tableName 时直接用 mock 数据
    if (id === 'preview' || !schema.tableName) {
      setRecord(buildMockRecords(validFields, 1)[0] ?? {})
      return
    }
    fetchDynamicQuery({
      table: schema.tableName,
      current: 1,
      size: 100,
      filter: `id:eq:${id}`,
    })
      .then((res) => {
        if (res.code === 200 && res.data?.records?.length) {
          // 后端记录 key 是 dbColumn（snake_case）→ 转成 fieldKey 供详情渲染
          setRecord(mapRecordToFront(res.data.records[0], columnKeyMap))
        } else {
          setRecord(buildMockRecords(validFields, 1)[0] ?? {})
        }
      })
      .catch(() => {
        setRecord(buildMockRecords(validFields, 1)[0] ?? {})
      })
  }, [schema, id, sortedFields, columnKeyMap])

  const validFields = useMemo(
    () => sortedFields.filter((f) => f.fieldKey && !f.isAction),
    [sortedFields],
  )

  const detailInfoFields = useMemo<DetailFieldItem[]>(() => {
    return validFields.map((field) => ({
      label: field.fieldLabel || field.fieldKey,
      value: renderDetailValue(field, record[field.fieldKey]),
    }))
  }, [validFields, record])

  const detailHeader = schema?.detailHeader
  const primaryName = useMemo(() => {
    const key = detailHeader?.primaryNameFieldKey
    if (!key) return schema?.pageName || '详情'
    const val = record[key]
    if (val != null && val !== '') return String(val)
    return '主名称占位'
  }, [detailHeader, record, schema])

  const avatar = useMemo<string | undefined>(() => {
    if (!detailHeader?.showAvatar) return undefined
    return (primaryName || '?').charAt(0)
  }, [detailHeader, primaryName])

  const tags = useMemo<DetailTagItem[]>(() => {
    return (detailHeader?.tags || [])
      .filter((t) => t.tagText.trim())
      .map((t) => ({ text: t.tagText, variant: t.variant }))
  }, [detailHeader])

  const [activeTab, setActiveTab] = useState('')

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
      const fieldMap = new Map((schema?.fields || []).map((f) => [f.fieldKey, f]))
      // 渲染单个字段网格
      const renderFieldGrid = (keys: string[]) => (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '8px 32px',
        }}>
          {keys.map((key, i) => {
            const field = fieldMap.get(key)
            const label = field?.fieldLabel || key
            const val = record[key]
            const displayVal = val != null && val !== '' ? String(val) : '-'
            return (
              <div key={i} style={{ display: 'flex' }}>
                <span style={{ color: 'rgba(0,0,0,0.45)', whiteSpace: 'nowrap' }}>{label}：</span>
                <span style={{ color: 'rgba(0,0,0,0.88)' }}>{displayVal}</span>
              </div>
            )
          })}
        </div>
      )

      // 优先走分组模式：Tab → Groups → Fields
      const validGroups = (tab.fieldGroups || []).filter(
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
                    emptyHint('该分组暂无字段')
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
          {tab.subTableTitle && <div style={{ fontWeight: 500, marginBottom: 8 }}>{tab.subTableTitle}</div>}
          <Table columns={columns} dataSource={mockRows} pagination={false} size="small" bordered />
        </div>
      )
    }
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

  const tabs = useMemo<DetailTabItem[]>(() => {
    return (detailHeader?.tabs || [])
      .filter((t) => t.tabLabel.trim())
      .map((t, idx) => ({
        key: t.tabKey || `tab-${idx}`,
        label: t.tabLabel,
        children: renderTabContent(t),
      }))
  }, [detailHeader, record])

  // 默认正文：tabLabel 为空的 tab 作为单一正文区域（无 Tab 头）
  const defaultContent = useMemo<ReactNode>(() => {
    const defaultTabs = (detailHeader?.tabs || []).filter((t) => !t.tabLabel.trim())
    if (defaultTabs.length === 0) return null
    return (
      <div style={{ margin: '16px 0 0' }}>
        {defaultTabs.map((t, idx) => <div key={`default-${idx}`}>{renderTabContent(t)}</div>)}
      </div>
    )
  }, [detailHeader, record])

  const currentTab = tabs.length > 0 ? (activeTab || tabs[0].key) : undefined

  const titleActions = useMemo<ReactNode>(() => {
    const btns = (detailHeader?.titleActions || []).filter((b) => b.btnLabel.trim())
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
  }, [detailHeader])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 120 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (error || !schema) {
    return (
      <div style={{ padding: 60 }}>
        <Empty description={error || '未找到页面配置'} />
      </div>
    )
  }

  return (
    <DetailPageTemplate
      title={schema.pageName}
      showBack
      onBack={handleBack}
      titleActions={titleActions}
      avatar={avatar}
      primaryName={primaryName}
      tags={tags.length > 0 ? tags : undefined}
      infoFields={detailInfoFields}
      infoColumns={2}
      showDivider
      tabs={tabs.length > 0 ? tabs : undefined}
      activeTab={currentTab}
      onTabChange={setActiveTab}
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
  )
}

export default function DynamicDetailPage() {
  return (
    <PageErrorBoundary>
      <DynamicDetailPageInner />
    </PageErrorBoundary>
  )
}
