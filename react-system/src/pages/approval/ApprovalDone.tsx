import { useCallback, useEffect, useState } from 'react'
import { ActionCell, CompanyMessage, CompanyTag, SmartListTemplate } from '@donglegeyu/company-ui'
import type { ColumnField, FieldDefinition } from '@donglegeyu/company-ui'
import { fetchDone, fmtTime, type DoneItem } from './api'
import { InstanceDetailDrawer } from './InstanceDetailDrawer'

/** myAction 是业务数据列（record.action）；SmartListTemplate 保留 'action' 为操作列保留名，需避开 */
const fields: FieldDefinition[] = [
  { key: 'processName', label: '流程', type: 'item', width: 140, hideInFilter: true },
  { key: 'title', label: '申请标题', type: 'item', hideInFilter: true },
  { key: 'myAction', label: '我的处理', type: 'item', width: 120, hideInFilter: true },
  { key: 'comment', label: '处理意见', type: 'item', hideInFilter: true },
  { key: 'handleTime', label: '处理时间', type: 'item', width: 180, hideInFilter: true },
  { key: 'action', label: '操作', type: 'item', width: 100, fixed: 'right', hideInFilter: true },
]

/** 列设置初始列：action 由模板生成为固定操作列，不进列设置 */
const defaultColumnFields: ColumnField[] = [
  { key: 'processName', label: '流程', visible: true, width: 140 },
  { key: 'title', label: '申请标题', visible: true },
  { key: 'myAction', label: '我的处理', visible: true, width: 120 },
  { key: 'comment', label: '处理意见', visible: true },
  { key: 'handleTime', label: '处理时间', visible: true, width: 180 },
]

function renderDash(value: unknown) {
  return <>{value == null || value === '' ? '-' : value}</>
}

export default function ApprovalDone() {
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<DoneItem[]>([])
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [size, setSize] = useState(10)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let ignore = false
    async function run() {
      try {
        const res = await fetchDone({ current, size })
        if (ignore) return
        if (res.code === 200 && res.data) {
          setRecords(res.data.records)
          setTotal(res.data.total)
        } else {
          CompanyMessage.error(res.message || '已办任务加载失败')
        }
      } catch {
        if (!ignore) CompanyMessage.error('已办任务加载失败')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    void run()
    return () => {
      ignore = true
    }
  }, [current, size, refreshKey])

  /** 事件路径刷新：亮 loading 并触发 effect 重新拉取 */
  const reload = useCallback(() => {
    setLoading(true)
    setRefreshKey((key) => key + 1)
  }, [])

  const openDetail = (instanceId: string) => {
    setActiveInstanceId(instanceId)
    setDrawerOpen(true)
  }

  return (
    <>
      <SmartListTemplate
        title="已办任务"
        fields={fields}
        defaultColumnFields={defaultColumnFields}
        dataSource={records as unknown as Record<string, unknown>[]}
        loading={loading}
        rowKey="taskId"
        pagination={{ current, pageSize: size, total }}
        onPaginationChange={({ current: page, pageSize }) => {
          setLoading(true)
          setCurrent(page)
          setSize(pageSize)
        }}
        onRefresh={() => reload()}
        bodyCell={(column, record) => {
          if (column.key === 'processName') return renderDash(record.processName)
          if (column.key === 'title') return renderDash(record.title)
          if (column.key === 'myAction') {
            const v = record.action as string
            if (v === 'approve') return <CompanyTag color="success">同意</CompanyTag>
            if (v === 'reject') return <CompanyTag color="error">驳回</CompanyTag>
            return <CompanyTag>{v}</CompanyTag>
          }
          if (column.key === 'comment') return renderDash(record.comment)
          if (column.key === 'handleTime') return <>{fmtTime(record.handleTime as string)}</>
          if (column.key === 'action') {
            return (
              <ActionCell
                buttons={[
                  {
                    key: 'detail',
                    label: '详情',
                    onClick: () => openDetail(record.processInstanceId as string),
                  },
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
