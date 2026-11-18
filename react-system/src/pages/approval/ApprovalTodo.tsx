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
  StatisticsListPage,
  type PageResponse,
  type StatisticCardConfig,
  type StatisticsColumn,
} from '@donglegeyu/company-ui'
import {
  actionText,
  addSignTask,
  approveTask,
  fetchMyCards,
  fetchTaskDetail,
  fetchTodo,
  fmtTime,
  rejectTask,
  toUserOptions,
  transferTask,
  type MyCards,
  type TaskDetail,
  type TaskItem,
} from './api'
import { useSysUsers } from './useSysUsers'
import { API_ENDPOINTS } from '@/constants/api'

/** 顶部搜索框对应字段：按任务名称/标题模糊匹配 */
const SEARCH_KEY = 'keyword'

/** 高级筛选抽屉字段：申请人 */
const filterFields = [
  { key: 'applicantName', label: '申请人', type: 'input' as const },
]

interface TaskRecord extends TaskItem, Record<string, unknown> {}

export function ApprovalTodo() {
  const { token } = theme.useToken()

  /** 表格列配置：render 内使用主题 token，故定义在组件内部 */
  const columns: StatisticsColumn<TaskRecord>[] = [
    {
      key: 'processName',
      label: '流程',
      width: 140,
      render: (_, record) => <>{record.processName || '-'}</>,
    },
    {
      key: 'title',
      label: '申请标题',
      render: (_, record) => {
        if (record.title) return <>{record.title}</>
        return (
          <span style={{ color: token.colorTextQuaternary }}>
            未关联业务单据（{record.processInstanceId.slice(0, 8)}）
          </span>
        )
      },
    },
    {
      key: 'taskName',
      label: '当前节点',
      width: 140,
      render: (_, record) => <>{record.taskName || '-'}</>,
    },
    {
      key: 'applicantName',
      label: '申请人',
      width: 120,
      render: (_, record) => <>{record.applicantName || '-'}</>,
    },
    {
      key: 'createTime',
      label: '发起时间',
      width: 180,
      render: (_, record) => <>{fmtTime(record.createTime)}</>,
    },
  ]

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

  /** 操作成功后触发列表重拉（转办/加签后任务会从待办消失） */
  const [refreshKey, setRefreshKey] = useState(0)

  /** 统计卡片数据：审批动作成功后随 refreshKey 重拉；加载失败静默降级（不渲染卡片区） */
  const [cards, setCards] = useState<MyCards | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchMyCards()
      .then((res) => {
        if (!cancelled && res.code === 200 && res.data) {
          setCards(res.data)
        }
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  const statisticCards: StatisticCardConfig[] | undefined = cards
    ? [
        { key: 'myTodo', title: '我的待办', value: cards.myTodoCount },
        { key: 'approachingOverdue', title: '即将超时', value: cards.approachingOverdueCount },
        { key: 'overdue', title: '超时预警', value: cards.overdueCount },
        { key: 'submitFail', title: '提交失败', value: cards.submitFailCount },
      ]
    : undefined

  const fetchData = useCallback(
    async (params: Record<string, unknown>): Promise<PageResponse<TaskRecord>> => {
      const keyword = String(params.keyword ?? '').trim()
      const applicantName = String(params.applicantName ?? '').trim()
      const res = await fetchTodo({
        current: Number(params.pageNum ?? 1),
        size: Number(params.pageSize ?? 10),
        keyword: keyword || undefined,
        applicantName: applicantName || undefined,
      })
      if (res.code !== 200 || !res.data) {
        CompanyMessage.error(res.message || '待办任务加载失败')
        return { list: [], total: 0, pageNum: 1, pageSize: 10 }
      }
      return {
        // 后端为 MyBatis-Plus IPage 契约（records/current/size），在此处统一转成 PageResponse
        list: res.data.records as unknown as TaskRecord[],
        total: res.data.total,
        pageNum: res.data.current,
        pageSize: res.data.size,
      }
    },
    // refreshKey 仅用于触发重拉，不参与请求参数
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey],
  )

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
        setRefreshKey((key) => key + 1)
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
        setRefreshKey((key) => key + 1)
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
      <StatisticsListPage<TaskRecord>
        title="待办任务"
        statisticCards={statisticCards}
        searchPlaceholder="搜索任务名称"
        searchKey={SEARCH_KEY}
        filterFields={filterFields}
        columns={columns}
        rowKey="taskId"
        defaultPageSize={10}
        fetchData={fetchData}
        viewEndpoint={API_ENDPOINTS.APPROVAL_VIEWS}
        emptyText="暂无待办任务"
        actionColumn={{
          width: 100,
          title: '操作',
          render: (record) => (
            <ActionCell
              buttons={[
                {
                  key: 'view',
                  label: '查看',
                  onClick: () => openDetail(record.taskId),
                },
              ]}
            />
          ),
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
