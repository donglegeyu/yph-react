import { useCallback, useEffect, useState } from 'react'
import { ActionCell, CompanyMessage, CompanyTag, SmartListTemplate } from '@donglegeyu/company-ui'
import type { ColumnField, FieldDefinition } from '@donglegeyu/company-ui'
import {
  fetchMine,
  fmtTime,
  urgeInstance,
  withdrawInstance,
  INSTANCE_STATUS_META,
  type InstanceItem,
} from './api'
import { InstanceDetailDrawer } from './InstanceDetailDrawer'

const fields: FieldDefinition[] = [
  {
    key: 'status',
    label: '状态',
    type: 'select',
    width: 110,
    options: [
      { label: '全部', value: '' },
      { label: '进行中', value: 'running' },
      { label: '已完成', value: 'approved' },
      { label: '已驳回', value: 'rejected' },
      { label: '已撤回', value: 'withdrawn' },
    ],
  },
  { key: 'processName', label: '流程', type: 'item', width: 140, hideInFilter: true },
  { key: 'title', label: '申请标题', type: 'item', hideInFilter: true },
  { key: 'businessNo', label: '业务单号', type: 'item', width: 180, hideInFilter: true },
  { key: 'startTime', label: '发起时间', type: 'item', width: 180, hideInFilter: true },
  { key: 'endTime', label: '结束时间', type: 'item', width: 180, hideInFilter: true },
  { key: 'action', label: '操作', type: 'item', width: 170, fixed: 'right', hideInFilter: true },
]

/** 列设置初始列：action 由模板生成为固定操作列，不进列设置 */
const defaultColumnFields: ColumnField[] = [
  { key: 'status', label: '状态', visible: true, width: 110 },
  { key: 'processName', label: '流程', visible: true, width: 140 },
  { key: 'title', label: '申请标题', visible: true },
  { key: 'businessNo', label: '业务单号', visible: true, width: 180 },
  { key: 'startTime', label: '发起时间', visible: true, width: 180 },
  { key: 'endTime', label: '结束时间', visible: true, width: 180 },
]

function renderDash(value: unknown) {
  return <>{value == null || value === '' ? '-' : value}</>
}

export default function ApprovalMine() {
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<InstanceItem[]>([])
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [size, setSize] = useState(10)
  const [status, setStatus] = useState('')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let ignore = false
    async function run() {
      try {
        const res = await fetchMine({ current, size, status: status || undefined })
        if (ignore) return
        if (res.code === 200 && res.data) {
          setRecords(res.data.records)
          setTotal(res.data.total)
        } else {
          CompanyMessage.error(res.message || '我发起的加载失败')
        }
      } catch {
        if (!ignore) CompanyMessage.error('我发起的加载失败')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    void run()
    return () => {
      ignore = true
    }
  }, [current, size, status, refreshKey])

  /** 事件路径刷新：亮 loading 并触发 effect 重新拉取 */
  const reload = useCallback(() => {
    setLoading(true)
    setRefreshKey((key) => key + 1)
  }, [])

  const openDetail = (instanceId: string) => {
    setActiveInstanceId(instanceId)
    setDrawerOpen(true)
  }

  const handleUrge = async (instanceId: string) => {
    try {
      const res = await urgeInstance(instanceId)
      if (res.code === 200) {
        CompanyMessage.success('已提醒审批人尽快处理')
      } else {
        CompanyMessage.error(res.message || '催办失败')
      }
    } catch {
      CompanyMessage.error('催办失败')
    }
  }

  const handleWithdraw = async (instanceId: string) => {
    try {
      const res = await withdrawInstance(instanceId)
      if (res.code === 200) {
        CompanyMessage.success('已撤回')
        reload()
      } else {
        CompanyMessage.error(res.message || '撤回失败')
      }
    } catch {
      CompanyMessage.error('撤回失败')
    }
  }

  return (
    <>
      <SmartListTemplate
        title="我发起的"
        fields={fields}
        defaultColumnFields={defaultColumnFields}
        dataSource={records as unknown as Record<string, unknown>[]}
        loading={loading}
        rowKey="instanceId"
        pagination={{ current, pageSize: size, total }}
        onPaginationChange={({ current: page, pageSize }) => {
          setLoading(true)
          setCurrent(page)
          setSize(pageSize)
        }}
        onSearch={(data) => {
          setLoading(true)
          setCurrent(1)
          setStatus((data.status as string) || '')
        }}
        onReset={() => {
          setLoading(true)
          setCurrent(1)
          setStatus('')
        }}
        onRefresh={() => reload()}
        bodyCell={(column, record) => {
          if (column.key === 'status') {
            const v = record.status as string
            const meta = INSTANCE_STATUS_META[v] || { text: v, color: 'default' as const }
            return <CompanyTag color={meta.color}>{meta.text}</CompanyTag>
          }
          if (column.key === 'processName') return renderDash(record.processName)
          if (column.key === 'title') return renderDash(record.title)
          if (column.key === 'businessNo') return renderDash(record.businessNo)
          if (column.key === 'startTime') return <>{fmtTime(record.startTime as string)}</>
          if (column.key === 'endTime') return <>{fmtTime(record.endTime as string)}</>
          if (column.key === 'action') {
            const running = record.status === 'running'
            return (
              <ActionCell
                maxVisible={3}
                buttons={[
                  {
                    key: 'detail',
                    label: '详情',
                    onClick: () => openDetail(record.instanceId as string),
                  },
                  ...(running
                    ? [
                        {
                          key: 'urge',
                          label: '催办',
                          onClick: () => handleUrge(record.instanceId as string),
                        },
                        {
                          key: 'withdraw',
                          label: '撤回',
                          danger: true,
                          confirm: true,
                          confirmTitle: `确定撤回「${
                            (record.title as string) || (record.businessNo as string) || '该申请'
                          }」吗？撤回后流程终止。`,
                          onClick: () => handleWithdraw(record.instanceId as string),
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
