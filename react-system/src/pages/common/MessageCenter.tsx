import { useCallback, useEffect, useState } from 'react'
import { Button } from 'antd'
import {
  ActionCell,
  CompanyMessage,
  CompanyTag,
  SmartListTemplate,
  type ColumnField,
  type FieldDefinition,
} from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'
import { useMenuTitle, useUnreadCount } from '@/hooks'
import { get, put } from '@/utils/request'

interface NotifyMessageRecord {
  id: number
  userId: number
  templateCode: string | null
  title: string
  content: string
  type: number
  readStatus: number
  readTime: string | null
  createTime: string
}

/** title/readStatus 为筛选字段；其余为数据列（hideInFilter），action 为模板保留操作列 */
const fields: FieldDefinition[] = [
  { key: 'title', label: '消息标题', type: 'input', width: 180 },
  { key: 'readStatus', label: '已读状态', type: 'select', width: 110, options: [
    { label: '全部', value: '' },
    { label: '未读', value: 0 },
    { label: '已读', value: 1 },
  ]},
  { key: 'content', label: '消息内容', type: 'item', hideInFilter: true },
  { key: 'readTime', label: '已读时间', type: 'item', width: 170, hideInFilter: true },
  { key: 'createTime', label: '接收时间', type: 'item', width: 170, hideInFilter: true },
  { key: 'action', label: '操作', type: 'item', width: 120, fixed: 'right' },
]

/** 列设置初始列：action 由模板生成为固定操作列，不进列设置 */
const defaultColumnFields: ColumnField[] = [
  { key: 'title', label: '消息标题', visible: true, width: 220 },
  { key: 'content', label: '消息内容', visible: true },
  { key: 'readStatus', label: '已读状态', visible: true, width: 100 },
  { key: 'readTime', label: '已读时间', visible: true, width: 170 },
  { key: 'createTime', label: '接收时间', visible: true, width: 170 },
]

function fmtTime(value: string | null) {
  return value == null || value === '' ? '-' : String(value).replace('T', ' ').slice(0, 19)
}

/** /my 接口要求登录态（需 userId 定位收件人），走 request 封装带 token，不用 useListData（原生 fetch 无鉴权头） */
export default function MessageCenter() {
  const menuTitle = useMenuTitle()
  const { refreshUnreadCount } = useUnreadCount()

  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<NotifyMessageRecord[]>([])
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [size, setSize] = useState(20)
  const [filters, setFilters] = useState<Record<string, unknown>>({})
  const [refreshKey, setRefreshKey] = useState(0)
  const [readAllLoading, setReadAllLoading] = useState(false)

  useEffect(() => {
    let ignore = false
    async function run() {
      try {
        const params: Record<string, unknown> = { current, size, ...filters }
        Object.keys(params).forEach((k) => {
          if (params[k] === '' || params[k] == null) delete params[k]
        })
        const res = await get<{ records: NotifyMessageRecord[]; total: number }>(
          API_ENDPOINTS.NOTIFY_MESSAGES_MY,
          params,
        )
        if (ignore) return
        if (res.code === 200 && res.data) {
          setRecords(res.data.records || [])
          setTotal(res.data.total || 0)
        } else {
          CompanyMessage.error(res.message || '收件箱加载失败')
        }
      } catch {
        if (!ignore) CompanyMessage.error('收件箱加载失败')
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

  const handleRead = useCallback(
    async (record: NotifyMessageRecord) => {
      try {
        const res = await put(`${API_ENDPOINTS.NOTIFY_MESSAGES}/read/${record.id}`)
        if (res.code === 200) {
          refreshUnreadCount()
          reload()
        } else {
          CompanyMessage.error(res.message || '操作失败')
        }
      } catch {
        CompanyMessage.error('操作失败')
      }
    },
    [reload, refreshUnreadCount],
  )

  const handleReadAll = useCallback(async () => {
    setReadAllLoading(true)
    try {
      const res = await put(API_ENDPOINTS.NOTIFY_MESSAGES_READ_ALL)
      if (res.code === 200) {
        CompanyMessage.success('已全部标记为已读')
        refreshUnreadCount()
        reload()
      } else {
        CompanyMessage.error(res.message || '操作失败')
      }
    } catch {
      CompanyMessage.error('操作失败')
    } finally {
      setReadAllLoading(false)
    }
  }, [reload, refreshUnreadCount])

  const bodyCell = useCallback(
    (column: Record<string, unknown>, record: Record<string, unknown>) => {
      const msg = record as unknown as NotifyMessageRecord

      if (column.key === 'title') {
        return msg.readStatus === 0 ? <strong>{msg.title}</strong> : <span>{msg.title}</span>
      }

      if (column.key === 'readStatus') {
        return msg.readStatus === 0 ? (
          <CompanyTag color="error">未读</CompanyTag>
        ) : (
          <CompanyTag color="default">已读</CompanyTag>
        )
      }

      if (column.key === 'content') {
        return <span>{msg.content || '-'}</span>
      }

      if (column.key === 'readTime') return <span>{fmtTime(msg.readTime)}</span>
      if (column.key === 'createTime') return <span>{fmtTime(msg.createTime)}</span>

      if (column.key === 'action') {
        if (msg.readStatus === 0) {
          const buttons = [{ key: 'read', label: '标记已读', onClick: () => handleRead(msg) }]
          return <ActionCell buttons={buttons} />
        }
        return null
      }

      return null
    },
    [handleRead],
  )

  const toolbarActions = (
    <Button type="primary" ghost loading={readAllLoading} onClick={handleReadAll}>
      全部已读
    </Button>
  )

  return (
    <SmartListTemplate
      title={menuTitle || '收件箱'}
      fields={fields}
      dataSource={records as unknown as Record<string, unknown>[]}
      loading={loading}
      pagination={{ current, pageSize: size, total }}
      onSearch={(data) => {
        setLoading(true)
        setCurrent(1)
        setFilters(data as Record<string, unknown>)
      }}
      onReset={() => {
        setLoading(true)
        setCurrent(1)
        setFilters({})
      }}
      onPaginationChange={({ current: page, pageSize }) => {
        setLoading(true)
        setCurrent(page)
        setSize(pageSize)
      }}
      columnFields={defaultColumnFields}
      defaultColumnFields={defaultColumnFields}
      onRefresh={reload}
      toolbarActions={toolbarActions}
      bodyCell={bodyCell}
    />
  )
}
