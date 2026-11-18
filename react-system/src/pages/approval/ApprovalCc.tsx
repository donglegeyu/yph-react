import { useCallback, useEffect, useState } from 'react'
import { ActionCell, CompanyMessage, CompanyTag, SmartListTemplate } from '@donglegeyu/company-ui'
import type { ColumnField, FieldDefinition } from '@donglegeyu/company-ui'
import { fetchCcMine, fmtTime, markCcRead, INSTANCE_STATUS_META, type CcItem } from './api'
import { InstanceDetailDrawer } from './InstanceDetailDrawer'

const fields: FieldDefinition[] = [
  { key: 'title', label: '申请标题', type: 'input' },
  { key: 'businessNo', label: '业务单号', type: 'input', width: 180 },
  {
    key: 'status',
    label: '审批状态',
    type: 'select',
    width: 110,
    options: [
      { label: '全部', value: '' },
      ...Object.entries(INSTANCE_STATUS_META).map(([value, meta]) => ({
        label: meta.text,
        value,
      })),
    ],
  },
  {
    key: 'readStatus',
    label: '阅读状态',
    type: 'select',
    width: 100,
    options: [
      { label: '全部', value: '' },
      { label: '未读', value: '0' },
      { label: '已读', value: '1' },
    ],
  },
  { key: 'createTime', label: '抄送时间', type: 'daterange', width: 180 },
  { key: 'action', label: '操作', type: 'item', width: 130, fixed: 'right', hideInFilter: true },
]

/** 列设置初始列：action 由模板生成为固定操作列，不进列设置 */
const defaultColumnFields: ColumnField[] = [
  { key: 'title', label: '申请标题', visible: true },
  { key: 'businessNo', label: '业务单号', visible: true, width: 180 },
  { key: 'status', label: '审批状态', visible: true, width: 110 },
  { key: 'readStatus', label: '阅读状态', visible: true, width: 100 },
  { key: 'createTime', label: '抄送时间', visible: true, width: 180 },
]

function renderDash(value: unknown) {
  return <>{value == null || value === '' ? '-' : value}</>
}

export default function ApprovalCc() {
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<CcItem[]>([])
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [size, setSize] = useState(10)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  /** 筛选状态：onSearch/onReset 驱动，effect 依赖变化即重新拉取 */
  const [filters, setFilters] = useState<{
    title?: string
    businessNo?: string
    status?: string
    readStatus?: number
    createTimeFrom?: string
    createTimeTo?: string
  }>({})

  useEffect(() => {
    let ignore = false
    async function run() {
      try {
        const res = await fetchCcMine({ current, size, ...filters })
        if (ignore) return
        if (res.code === 200 && res.data) {
          setRecords(res.data.records)
          setTotal(res.data.total)
        } else {
          CompanyMessage.error(res.message || '抄送列表加载失败')
        }
      } catch {
        if (!ignore) CompanyMessage.error('抄送列表加载失败')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    void run()
    return () => {
      ignore = true
    }
  }, [current, size, filters, refreshKey])

  /** 事件路径刷新：亮 loading 并触发 effect 重新拉取 */
  const reload = useCallback(() => {
    setLoading(true)
    setRefreshKey((key) => key + 1)
  }, [])

  const openDetail = (instanceId: string) => {
    setActiveInstanceId(instanceId)
    setDrawerOpen(true)
  }

  const handleRead = async (id: number) => {
    try {
      const res = await markCcRead(id)
      if (res.code === 200) {
        CompanyMessage.success('已标记已读')
        reload()
      } else {
        CompanyMessage.error(res.message || '标记失败')
      }
    } catch {
      CompanyMessage.error('标记失败')
    }
  }

  return (
    <>
      <SmartListTemplate
        title="抄送我的"
        fields={fields}
        defaultColumnFields={defaultColumnFields}
        dataSource={records as unknown as Record<string, unknown>[]}
        loading={loading}
        rowKey="id"
        pagination={{ current, pageSize: size, total }}
        onPaginationChange={({ current: page, pageSize }) => {
          setLoading(true)
          setCurrent(page)
          setSize(pageSize)
        }}
        onSearch={(data) => {
          setLoading(true)
          setCurrent(1)
          const range = data.createTime as string[] | undefined
          setFilters({
            title: (data.title as string) || undefined,
            businessNo: (data.businessNo as string) || undefined,
            status: (data.status as string) || undefined,
            readStatus:
              data.readStatus !== '' && data.readStatus != null
                ? Number(data.readStatus)
                : undefined,
            createTimeFrom: range?.[0],
            createTimeTo: range?.[1],
          })
        }}
        onReset={() => {
          setLoading(true)
          setCurrent(1)
          setFilters({})
        }}
        onRefresh={() => reload()}
        bodyCell={(column, record) => {
          if (column.key === 'title') return renderDash(record.title)
          if (column.key === 'businessNo') return renderDash(record.businessNo)
          if (column.key === 'status') {
            const v = record.status as string
            const meta = INSTANCE_STATUS_META[v] || { text: v, color: 'default' as const }
            return <CompanyTag color={meta.color}>{meta.text}</CompanyTag>
          }
          if (column.key === 'readStatus') {
            return (record.readStatus as number) === 1 ? (
              <CompanyTag>已读</CompanyTag>
            ) : (
              <CompanyTag color="warning">未读</CompanyTag>
            )
          }
          if (column.key === 'createTime') return <>{fmtTime(record.createTime as string)}</>
          if (column.key === 'action') {
            return (
              <ActionCell
                buttons={[
                  {
                    key: 'detail',
                    label: '详情',
                    onClick: () => openDetail(record.instanceId as string),
                  },
                  ...((record.readStatus as number) === 0
                    ? [
                        {
                          key: 'read',
                          label: '标记已读',
                          onClick: () => handleRead(record.id as number),
                        },
                      ]
                    : []),
                ]}
              />
            )
          }
          return null
        }}
      />

      <InstanceDetailDrawer
        key={drawerOpen && activeInstanceId ? activeInstanceId : 'closed'}
        open={drawerOpen}
        instanceId={activeInstanceId}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  )
}
