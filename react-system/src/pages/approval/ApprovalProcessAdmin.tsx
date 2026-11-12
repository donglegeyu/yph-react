import { useCallback, useEffect, useState } from 'react'
import { CompanyMessage, SmartListTemplate } from '@donglegeyu/company-ui'
import type { ColumnField, FieldDefinition } from '@donglegeyu/company-ui'
import { fetchProcessDefinitions, fmtTime, type ProcessDefItem } from './api'

/** 全部为展示列（type: 'item' + hideInFilter），页面无筛选区；hideInFilter 防止 item 字段漏进筛选表单 */
const fields: FieldDefinition[] = [
  { key: 'key', label: '流程标识', type: 'item', width: 220, hideInFilter: true },
  { key: 'name', label: '流程名称', type: 'item', hideInFilter: true },
  { key: 'version', label: '版本', type: 'item', width: 100, hideInFilter: true },
  { key: 'deploymentId', label: '部署 ID', type: 'item', width: 320, hideInFilter: true },
  { key: 'deployTime', label: '部署时间', type: 'item', width: 180, hideInFilter: true },
]

const defaultColumnFields: ColumnField[] = fields.map(({ key, label, width }) => ({
  key,
  label,
  visible: true,
  width,
}))

function renderDash(value: unknown) {
  return <>{value == null || value === '' ? '-' : value}</>
}

export default function ApprovalProcessAdmin() {
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<ProcessDefItem[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let ignore = false
    async function run() {
      try {
        const res = await fetchProcessDefinitions()
        if (ignore) return
        if (res.code === 200 && res.data) {
          setRecords(res.data)
        } else {
          CompanyMessage.error(res.message || '流程定义加载失败')
        }
      } catch {
        if (!ignore) CompanyMessage.error('流程定义加载失败')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    void run()
    return () => {
      ignore = true
    }
  }, [refreshKey])

  /** 事件路径刷新：亮 loading 并触发 effect 重新拉取 */
  const reload = useCallback(() => {
    setLoading(true)
    setRefreshKey((key) => key + 1)
  }, [])

  return (
    <SmartListTemplate
      title="流程定义"
      fields={fields}
      defaultColumnFields={defaultColumnFields}
      dataSource={records as unknown as Record<string, unknown>[]}
      loading={loading}
      pagination={false}
      rowKey="deploymentId"
      onRefresh={() => reload()}
      bodyCell={(column, record) => {
        if (column.key === 'name') return renderDash(record.name)
        if (column.key === 'version') return <>v{record.version as number}</>
        if (column.key === 'deployTime') return <>{fmtTime(record.deployTime as string)}</>
        return null
      }}
    />
  )
}
