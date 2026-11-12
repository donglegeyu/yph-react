import { useCallback, useEffect, useState } from 'react'
import { theme } from 'antd'
import {
  ActionCell,
  CompanyButton,
  CompanyDescriptions,
  CompanyEmpty,
  CompanyInput,
  CompanyMessage,
  CompanyModal,
  CompanySelect,
  CompanySpace,
  CompanyTimeline,
  DrawerDetailTemplate,
  SectionTitle,
  SmartListTemplate,
} from '@donglegeyu/company-ui'
import type { ColumnField, FieldDefinition } from '@donglegeyu/company-ui'
import {
  actionText,
  addSignTask,
  approveTask,
  fetchTaskDetail,
  fetchTodo,
  fmtTime,
  rejectTask,
  toUserOptions,
  transferTask,
  type TaskDetail,
  type TaskItem,
} from './api'
import { useSysUsers } from './useSysUsers'

const fields: FieldDefinition[] = [
  { key: 'keyword', label: '任务名称', type: 'input', placeholder: '按任务名称筛选' },
  { key: 'processName', label: '流程', type: 'item', width: 140, hideInFilter: true },
  { key: 'title', label: '申请标题', type: 'item', hideInFilter: true },
  { key: 'taskName', label: '当前节点', type: 'item', width: 140, hideInFilter: true },
  { key: 'applicantName', label: '申请人', type: 'item', width: 120, hideInFilter: true },
  { key: 'createTime', label: '发起时间', type: 'item', width: 180, hideInFilter: true },
  { key: 'action', label: '操作', type: 'item', width: 100, fixed: 'right', hideInFilter: true },
]

/** 列设置初始列：keyword 仅作筛选项不进列，action 由模板生成为固定操作列 */
const defaultColumnFields: ColumnField[] = [
  { key: 'processName', label: '流程', visible: true, width: 140 },
  { key: 'title', label: '申请标题', visible: true },
  { key: 'taskName', label: '当前节点', visible: true, width: 140 },
  { key: 'applicantName', label: '申请人', visible: true, width: 120 },
  { key: 'createTime', label: '发起时间', visible: true, width: 180 },
]

function renderDash(value: unknown) {
  return <>{value == null || value === '' ? '-' : value}</>
}

export default function ApprovalTodo() {
  const { token } = theme.useToken()
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<TaskItem[]>([])
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [size, setSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [detail, setDetail] = useState<TaskDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [transferOpen, setTransferOpen] = useState(false)
  const [transferTarget, setTransferTarget] = useState<number | undefined>()
  const [transferSubmitting, setTransferSubmitting] = useState(false)
  const [pickAction, setPickAction] = useState<'transfer' | 'add-sign'>('transfer')
  const { users, loading: usersLoading } = useSysUsers()

  useEffect(() => {
    let ignore = false
    async function run() {
      try {
        const res = await fetchTodo({ current, size, keyword: keyword || undefined })
        if (ignore) return
        if (res.code === 200 && res.data) {
          setRecords(res.data.records)
          setTotal(res.data.total)
        } else {
          CompanyMessage.error(res.message || '待办任务加载失败')
        }
      } catch {
        if (!ignore) CompanyMessage.error('待办任务加载失败')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    void run()
    return () => {
      ignore = true
    }
  }, [current, size, keyword, refreshKey])

  /** 事件路径刷新：亮 loading 并触发 effect 重新拉取 */
  const reload = useCallback(() => {
    setLoading(true)
    setRefreshKey((key) => key + 1)
  }, [])

  const openDetail = async (taskId: string) => {
    setDrawerOpen(true)
    setDetail(null)
    setComment('')
    setTransferTarget(undefined)
    setDetailLoading(true)
    try {
      const res = await fetchTaskDetail(taskId)
      if (res.code === 200 && res.data) {
        setDetail(res.data)
      } else {
        CompanyMessage.error(res.message || '任务详情加载失败')
      }
    } catch {
      CompanyMessage.error('任务详情加载失败')
    } finally {
      setDetailLoading(false)
    }
  }

  const submit = async (approved: boolean) => {
    if (!detail) return
    setSubmitting(true)
    try {
      const res = approved
        ? await approveTask(detail.taskId, comment)
        : await rejectTask(detail.taskId, comment)
      if (res.code === 200) {
        CompanyMessage.success(approved ? '已同意' : '已驳回')
        setDrawerOpen(false)
        reload()
      } else {
        CompanyMessage.error(res.message || '操作失败')
      }
    } catch {
      CompanyMessage.error('操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const submitPick = async () => {
    if (!detail || !transferTarget) return
    setTransferSubmitting(true)
    try {
      const target = users.find((item) => item.id === transferTarget)
      const targetName = target ? target.realName || target.nickname || target.username : String(transferTarget)
      const res =
        pickAction === 'transfer'
          ? await transferTask(detail.taskId, transferTarget, targetName, comment || undefined)
          : await addSignTask(detail.taskId, transferTarget, targetName, comment || undefined)
      if (res.code === 200) {
        CompanyMessage.success(pickAction === 'transfer' ? '已转办' : '已加签')
        setTransferOpen(false)
        setDrawerOpen(false)
        reload()
      } else {
        CompanyMessage.error(res.message || (pickAction === 'transfer' ? '转办失败' : '加签失败'))
      }
    } catch {
      CompanyMessage.error(pickAction === 'transfer' ? '转办失败' : '加签失败')
    } finally {
      setTransferSubmitting(false)
    }
  }

  return (
    <>
      <SmartListTemplate
        title="待办任务"
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
        onSearch={(data) => {
          setLoading(true)
          setCurrent(1)
          setKeyword((data.keyword as string) || '')
        }}
        onReset={() => {
          setLoading(true)
          setCurrent(1)
          setKeyword('')
        }}
        onRefresh={() => reload()}
        bodyCell={(column, record) => {
          if (column.key === 'title') {
            const v = record.title as string | null
            if (v) return <>{v}</>
            return (
              <span style={{ color: token.colorTextQuaternary }}>
                未关联业务单据（{(record.processInstanceId as string).slice(0, 8)}）
              </span>
            )
          }
          if (column.key === 'processName') return renderDash(record.processName)
          if (column.key === 'taskName') return renderDash(record.taskName)
          if (column.key === 'applicantName') return renderDash(record.applicantName)
          if (column.key === 'createTime') return <>{fmtTime(record.createTime as string)}</>
          if (column.key === 'action') {
            return (
              <ActionCell
                buttons={[
                  {
                    key: 'view',
                    label: '查看',
                    onClick: () => openDetail(record.taskId as string),
                  },
                ]}
              />
            )
          }
          return null
        }}
      />

      <DrawerDetailTemplate
        title="任务详情"
        width={640}
        open={drawerOpen}
        loading={detailLoading}
        onClose={() => setDrawerOpen(false)}
        headerContent={
          detail ? <span style={{ fontWeight: 600 }}>{detail.title || '未关联业务单据'}</span> : null
        }
        footer={
          detail ? (
            <CompanySpace>
              <CompanyButton
                onClick={() => {
                  setPickAction('transfer')
                  setTransferTarget(undefined)
                  setTransferOpen(true)
                }}
              >
                转办
              </CompanyButton>
              <CompanyButton
                onClick={() => {
                  setPickAction('add-sign')
                  setTransferTarget(undefined)
                  setTransferOpen(true)
                }}
              >
                加签
              </CompanyButton>
              <CompanyButton danger loading={submitting} onClick={() => submit(false)}>
                驳回
              </CompanyButton>
              <CompanyButton type="primary" loading={submitting} onClick={() => submit(true)}>
                同意
              </CompanyButton>
            </CompanySpace>
          ) : null
        }
      >
        {detail ? (
          <>
            <CompanyDescriptions
              column={1}
              size="small"
              bordered
              items={[
                { key: 'processName', label: '流程', children: detail.processName || '-' },
                { key: 'title', label: '申请标题', children: detail.title || '-' },
                { key: 'businessNo', label: '业务单号', children: detail.businessNo || '-' },
                { key: 'applicantName', label: '申请人', children: detail.applicantName || '-' },
                { key: 'taskName', label: '当前节点', children: detail.taskName },
                { key: 'createTime', label: '发起时间', children: fmtTime(detail.createTime) },
                {
                  key: 'formData',
                  label: '表单内容',
                  children: detail.formData ? (
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>{detail.formData}</pre>
                  ) : (
                    '-'
                  ),
                },
              ]}
            />

            <SectionTitle title="处理记录" />
            {detail.timeline.length ? (
              <CompanyTimeline
                items={detail.timeline.map((item) => ({
                  color: item.action === 'reject' ? 'red' : 'green',
                  children: (
                    <div>
                      <div>
                        {item.operatorName || '-'} · {actionText(item.action)}
                      </div>
                      <div style={{ color: token.colorTextTertiary, fontSize: 12 }}>
                        {fmtTime(item.time)} {item.comment ? `· ${item.comment}` : ''}
                      </div>
                    </div>
                  ),
                }))}
              />
            ) : (
              <CompanyEmpty image={CompanyEmpty.PRESENTED_IMAGE_SIMPLE} description="暂无处理记录" />
            )}

            <SectionTitle title="审批意见" />
            <CompanyInput.TextArea
              rows={3}
              maxLength={500}
              placeholder="选填，最多 500 字"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </>
        ) : null}
      </DrawerDetailTemplate>

      <CompanyModal
        title={pickAction === 'transfer' ? '转办' : '加签'}
        open={transferOpen}
        confirmLoading={transferSubmitting}
        okButtonProps={{ disabled: !transferTarget }}
        onOk={submitPick}
        onCancel={() => setTransferOpen(false)}
      >
        <div style={{ marginBottom: 8 }}>
          {pickAction === 'transfer'
            ? '选择转办接收人，转办后由对方处理该任务：'
            : '选择加签人员，加签后对方与您共同处理该任务：'}
        </div>
        <CompanySelect
          showSearch
          optionFilterProp="label"
          loading={usersLoading}
          value={transferTarget}
          onChange={(value) => setTransferTarget(value as number)}
          options={toUserOptions(users)}
          placeholder="请选择接收人"
          style={{ width: '100%' }}
        />
      </CompanyModal>
    </>
  )
}
