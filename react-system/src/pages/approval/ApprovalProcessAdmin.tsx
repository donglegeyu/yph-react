import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ActionCell,
  CompanyButton,
  CompanyMessage,
  CompanyTag,
  SmartListTemplate,
} from '@donglegeyu/company-ui'
import type { ColumnField, FieldDefinition } from '@donglegeyu/company-ui'
import {
  activateProcessDefinition,
  deleteProcessDeployment,
  fetchProcessDefinitions,
  fetchProcessDesigns,
  fmtTime,
  suspendProcessDefinition,
  type ProcessDefItem,
  type ProcessDesignItem,
} from './api'
import ProcessDefDetailDrawer from './ProcessDefDetailDrawer'

/** 业务视角列：隐藏引擎概念（流程标识/部署 ID），只留业务字段 */
const fields: FieldDefinition[] = [
  { key: 'name', label: '流程名称', type: 'item', hideInFilter: true },
  { key: 'version', label: '版本', type: 'item', width: 90, hideInFilter: true },
  { key: 'suspended', label: '状态', type: 'item', width: 100, hideInFilter: true },
  { key: 'deployTime', label: '发布时间', type: 'item', width: 180, hideInFilter: true },
  { key: 'action', label: '操作', type: 'item', width: 220, fixed: 'right', hideInFilter: true },
]

/** 列设置初始列：action 由模板生成为固定操作列，不进列设置 */
const defaultColumnFields: ColumnField[] = [
  { key: 'name', label: '流程名称', visible: true },
  { key: 'version', label: '版本', visible: true, width: 90 },
  { key: 'suspended', label: '状态', visible: true, width: 100 },
  { key: 'deployTime', label: '发布时间', visible: true, width: 180 },
]

function renderDash(value: unknown) {
  return <>{value == null || value === '' ? '-' : value}</>
}

export default function ApprovalProcessAdmin() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<ProcessDefItem[]>([])
  const [designs, setDesigns] = useState<ProcessDesignItem[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [detailRecord, setDetailRecord] = useState<ProcessDefItem | null>(null)

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
    // 设计草稿列表仅用于行级「设计」入口匹配，失败不打断页面
    fetchProcessDesigns()
      .then((res) => {
        if (!ignore && res.code === 200 && res.data) setDesigns(res.data)
      })
      .catch(() => undefined)
    return () => {
      ignore = true
    }
  }, [refreshKey])

  /** processKey → 设计草稿，用于行级「设计」按钮显隐 */
  const designByKey = useMemo(
    () => new Map(designs.map((design) => [design.processKey, design])),
    [designs],
  )

  /** 事件路径刷新：亮 loading 并触发 effect 重新拉取 */
  const reload = useCallback(() => {
    setLoading(true)
    setRefreshKey((key) => key + 1)
  }, [])

  const handleToggleSuspended = async (record: ProcessDefItem) => {
    const suspend = !record.suspended
    try {
      const res = suspend
        ? await suspendProcessDefinition(record.id)
        : await activateProcessDefinition(record.id)
      if (res.code === 200) {
        CompanyMessage.success(suspend ? '已停用' : '已启用')
        reload()
      } else {
        CompanyMessage.error(res.message || (suspend ? '停用失败' : '启用失败'))
      }
    } catch {
      CompanyMessage.error(suspend ? '停用失败' : '启用失败')
    }
  }

  const handleDeleteDeployment = async (record: ProcessDefItem) => {
    try {
      const res = await deleteProcessDeployment(record.deploymentId)
      if (res.code === 200) {
        CompanyMessage.success('流程已删除')
        reload()
      } else {
        CompanyMessage.error(res.message || '删除失败')
      }
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : '删除失败'
      CompanyMessage.error(message)
    }
  }

  return (
    <>
      <SmartListTemplate
        title="流程定义"
        fields={fields}
        defaultColumnFields={defaultColumnFields}
        dataSource={records as unknown as Record<string, unknown>[]}
        loading={loading}
        pagination={false}
        rowKey="id"
        onRefresh={() => reload()}
        titleRightActions={
          <CompanyButton type="primary" onClick={() => navigate('/approval/admin/process/design/new')}>
            新建流程
          </CompanyButton>
        }
        bodyCell={(column, record) => {
          if (column.key === 'name') return renderDash(record.name)
          if (column.key === 'version') return <>v{record.version as number}</>
          if (column.key === 'suspended') {
            return (record.suspended as boolean) ? (
              <CompanyTag color="warning">已停用</CompanyTag>
            ) : (
              <CompanyTag color="success">已启用</CompanyTag>
            )
          }
          if (column.key === 'deployTime') return <>{fmtTime(record.deployTime as string)}</>
          if (column.key === 'action') {
            const item = record as unknown as ProcessDefItem
            const draft = designByKey.get(item.key)
            return (
              <ActionCell
                maxVisible={2}
                buttons={[
                  {
                    key: 'detail',
                    label: '详情',
                    onClick: () => setDetailRecord(item),
                  },
                  // 无草稿的行不提供编辑：设计器是唯一创建/编辑入口，历史遗留流程直接删除
                  ...(draft
                    ? [
                        {
                          key: 'edit',
                          label: '编辑',
                          onClick: () => navigate(`/approval/admin/process/design/${draft.id}`),
                        },
                      ]
                    : []),
                  {
                    key: 'toggle',
                    label: item.suspended ? '启用' : '停用',
                    confirm: true,
                    confirmTitle: item.suspended
                      ? `确认启用流程「${item.name || item.key}」？启用后可发起新的审批`
                      : `确认停用流程「${item.name || item.key}」？停用后不可发起新的审批，进行中的审批不受影响`,
                    onClick: () => void handleToggleSuspended(item),
                  },
                  {
                    key: 'delete',
                    label: '删除',
                    danger: true,
                    confirm: true,
                    confirmTitle: `确认删除流程「${item.name || item.key}」？删除后不可恢复`,
                    onClick: () => void handleDeleteDeployment(item),
                  },
                ]}
              />
            )
          }
          return null
        }}
      />
      <ProcessDefDetailDrawer
        open={detailRecord !== null}
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
      />
    </>
  )
}
