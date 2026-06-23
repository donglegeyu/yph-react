import { useEffect, useCallback, useState } from 'react'
import { Tag, Space, App, Radio } from 'antd'
import {
  CompanyButton,
  CompanyMessage,
  SmartListTemplate,
  ActionCell,
  type FieldDefinition,
  type ColumnField,
} from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'
import { useListData } from '@/hooks'

interface TrainingTaskRecord {
  [key: string]: unknown
  id: number
  taskCode: string
  taskName: string
  taskCategory: string
  taskTarget: string
  taskCount: number
  startTime: string
  endTime: string
  certRule: string
  traineeCount: number
  completedCount: number
  taskStatus: string
  approvalStatus: string
  createdBy: string
  createdTime: string
}

// 任务状态配置
const taskStatusMap: Record<string, { text: string; color: string }> = {
  published: { text: '已发布', color: 'success' },
  draft: { text: '草稿', color: 'warning' },
  in_progress: { text: '进行中', color: 'processing' },
}

// 审批状态配置
const approvalStatusMap: Record<string, { text: string; color: string }> = {
  approved: { text: '审批通过', color: 'success' },
  rejected: { text: '审批拒绝', color: 'error' },
  reviewing: { text: '审批中', color: 'processing' },
  pending: { text: '未提交', color: 'default' },
}

// 发证规则选项
const certRuleOptions = [
  { label: '全部', value: '' },
  { label: '自动发证', value: 'auto' },
  { label: '人工审核', value: 'manual' },
]

// 任务分类选项
const taskCategoryOptions = [
  { label: '全部', value: '' },
  { label: '产品培训', value: 'product_training' },
  { label: '技能培训', value: 'skill_training' },
  { label: '安全培训', value: 'safety_training' },
  { label: '新人培训', value: 'newcomer_training' },
]

const fields: FieldDefinition[] = [
  { key: 'taskCode', label: '任务编码', type: 'input', width: 150, fixed: 'left' },
  { key: 'taskName', label: '任务名称', type: 'input', width: 180 },
  { key: 'taskCategory', label: '任务分类', type: 'select', width: 110, options: taskCategoryOptions },
  { key: 'taskTarget', label: '任务对象', type: 'input', width: 200 },
  { key: 'taskCount', label: '任务数量', type: 'input', width: 90 },
  { key: 'startTime', label: '开始时间', type: 'dateRange', width: 120 },
  { key: 'endTime', label: '结束时间', type: 'dateRange', width: 120 },
  { key: 'certRule', label: '发证规则', type: 'select', width: 100, options: certRuleOptions },
  { key: 'traineeCount', label: '参训人数', type: 'input', width: 90, hideInFilter: true },
  { key: 'completedCount', label: '已完成', type: 'input', width: 80, hideInFilter: true },
  { key: 'taskStatus', label: '任务状态', type: 'select', width: 95, options: [
    { label: '全部', value: '' },
    { label: '已发布', value: 'published' },
    { label: '草稿', value: 'draft' },
    { label: '进行中', value: 'in_progress' },
  ]},
  { key: 'approvalStatus', label: '审批状态', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '审批通过', value: 'approved' },
    { label: '审批拒绝', value: 'rejected' },
    { label: '审批中', value: 'reviewing' },
    { label: '未提交', value: 'pending' },
  ]},
  { key: 'createdBy', label: '创建人', type: 'input', width: 90 },
  { key: 'createdTime', label: '创建时间', type: 'dateRange', width: 155 },
  { key: 'action', label: '操作', width: 200, fixed: 'right' },
]

const defaultColumnFields: ColumnField[] = [
  { key: 'taskCode', label: '任务编码', visible: true, width: 150, fixed: 'left' },
  { key: 'taskName', label: '任务名称', visible: true, width: 180 },
  { key: 'taskCategory', label: '任务分类', visible: true, width: 110 },
  { key: 'taskTarget', label: '任务对象', visible: true, width: 200 },
  { key: 'taskCount', label: '任务数量', visible: true, width: 90 },
  { key: 'startTime', label: '开始时间', visible: true, width: 120 },
  { key: 'endTime', label: '结束时间', visible: true, width: 120 },
  { key: 'certRule', label: '发证规则', visible: true, width: 100 },
  { key: 'traineeCount', label: '参训人数', visible: true, width: 90 },
  { key: 'completedCount', label: '已完成', visible: true, width: 80 },
  { key: 'taskStatus', label: '任务状态', visible: true, width: 95 },
  { key: 'approvalStatus', label: '审批状态', visible: true, width: 100 },
  { key: 'createdBy', label: '创建人', visible: true, width: 90 },
  { key: 'createdTime', label: '创建时间', visible: true, width: 155 },
]

export default function TrainingTaskList() {
  const { modal } = App.useApp()
  const { loading, dataSource, pagination, filterParams, setFilterParams, fetchData, refresh } = useListData<TrainingTaskRecord>({
    apiEndpoint: API_ENDPOINTS.TRAINING_TASKS,
    defaultPageSize: 20,
  })

  const [columnFields, setColumnFields] = useState<ColumnField[]>(defaultColumnFields)
  const [taskViewMode, setTaskViewMode] = useState<string>('assigned')

  const handleColumnSettingsChange = useCallback((fields: ColumnField[]) => {
    const savedKeys = new Set(fields.map((f) => f.key))
    const missingFields = defaultColumnFields.filter((f) => !savedKeys.has(f.key))
    setColumnFields([...fields, ...missingFields])
  }, [])

  const handleColumnSettingsReset = useCallback(() => {
    setColumnFields(defaultColumnFields)
  }, [])

  // 新增
  const handleCreate = useCallback(() => {
    CompanyMessage.info('新增培训任务功能开发中')
  }, [])

  // 查看详情
  const handleDetail = useCallback((record: TrainingTaskRecord) => {
    CompanyMessage.info(`查看培训任务详情：${record.taskName}`)
  }, [])

  // 编辑
  const handleEdit = useCallback((record: TrainingTaskRecord) => {
    CompanyMessage.info(`编辑培训任务：${record.taskName}`)
  }, [])

  // 撤销
  const handleRevoke = useCallback((record: TrainingTaskRecord) => {
    modal.confirm({
      title: '确认要撤销该培训任务吗？',
      content: `任务「${record.taskName}」撤销后将无法恢复。是否确定执行撤销操作？`,
      okText: '确定',
      cancelText: '取消',
      centered: true,
      width: 400,
      onOk: async () => {
        try {
          const res = await fetch(`${API_ENDPOINTS.TRAINING_TASKS}/${record.id}/revoke`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
          })
          const json = await res.json()
          if (json.code === 200) {
            CompanyMessage.success('撤销成功')
            refresh()
          } else {
            CompanyMessage.error(json.message || '操作失败，请稍后重试')
          }
        } catch {
          CompanyMessage.error('操作失败，请稍后重试')
        }
      },
    })
  }, [refresh])

  // 删除
  const handleDelete = useCallback(async (record: TrainingTaskRecord) => {
    modal.confirm({
      title: '确认要删除该培训任务吗？',
      content: `任务「${record.taskName}」删除后数据将永久消失，无法恢复。是否确定执行删除操作？`,
      okText: '确定',
      cancelText: '取消',
      centered: true,
      width: 400,
      onOk: async () => {
        try {
          const res = await fetch(`${API_ENDPOINTS.TRAINING_TASKS}/${record.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          })
          const json = await res.json()
          if (json.code === 200) {
            CompanyMessage.success('删除成功')
            refresh()
          } else {
            CompanyMessage.error(json.message || '删除失败，请稍后重试')
          }
        } catch {
          CompanyMessage.error('删除失败，请稍后重试')
        }
      },
    })
  }, [refresh])

  // 提交审批
  const handleSubmitApproval = useCallback((record: TrainingTaskRecord) => {
    modal.confirm({
      title: '确认要提交审批吗？',
      content: `培训任务「${record.taskName}」将进入审批流程。是否确定提交？`,
      okText: '确定',
      cancelText: '取消',
      centered: true,
      width: 400,
      onOk: async () => {
        try {
          const res = await fetch(`${API_ENDPOINTS.TRAINING_TASKS}/${record.id}/submit-approval`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
          const json = await res.json()
          if (json.code === 200) {
            CompanyMessage.success('已提交审批')
            refresh()
          } else {
            CompanyMessage.error(json.message || '提交失败，请稍后重试')
          }
        } catch {
          CompanyMessage.error('提交失败，请稍后重试')
        }
      },
    })
  }, [refresh])

  const bodyCell = useCallback(
    (column: Record<string, unknown>, record: Record<string, unknown>) => {
      const r = record as unknown as TrainingTaskRecord

      // 任务分类
      if (column.key === 'taskCategory') {
        const option = taskCategoryOptions.find((o) => o.value === r.taskCategory)
        return <span>{option?.label || r.taskCategory || '-'}</span>
      }

      // 发证规则
      if (column.key === 'certRule') {
        const option = certRuleOptions.find((o) => o.value === r.certRule)
        return <span>{option?.label || r.certRule || '-'}</span>
      }

      // 任务状态（Tag）
      if (column.key === 'taskStatus') {
        const status = taskStatusMap[r.taskStatus as string]
        return status ? <Tag color={status.color}>{status.text}</Tag> : <span>-</span>
      }

      // 审批状态（Tag）
      if (column.key === 'approvalStatus') {
        const status = approvalStatusMap[r.approvalStatus as string]
        return status ? <Tag color={status.color}>{status.text}</Tag> : <span>-</span>
      }

      // 操作列
      if (column.key === 'action') {
        const buttons: Array<{ key: string; label: string; onClick?: () => void; danger?: boolean }> = [
          { key: 'detail', label: '详情', onClick: () => handleDetail(r) },
        ]

        // 已发布状态可撤销
        if (r.taskStatus === 'published') {
          buttons.push({ key: 'revoke', label: '撤销', onClick: () => handleRevoke(r) })
        }

        // 草稿/进行中状态可编辑和删除
        if (r.taskStatus === 'draft' || r.taskStatus === 'in_progress') {
          buttons.push({ key: 'edit', label: '编辑', onClick: () => handleEdit(r) })
          buttons.push({ key: 'delete', label: '删除', danger: true, onClick: () => handleDelete(r) })
        }

        // 未提交状态可提交审批
        if (r.approvalStatus === 'pending') {
          buttons.push({ key: 'submit', label: '提交审批', onClick: () => handleSubmitApproval(r) })
        }

        return <ActionCell buttons={buttons} />
      }

      return null
    },
    [handleDetail, handleEdit, handleRevoke, handleDelete, handleSubmitApproval],
  )

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toolbarActions = (
    <Space size={12}>
      <CompanyButton type="primary" onClick={handleCreate}>
        新增
      </CompanyButton>
    </Space>
  )

  const toolbarRightActions = (
    <Radio.Group
      value={taskViewMode}
      onChange={(e) => setTaskViewMode(e.target.value)}
      size="middle"
      optionType="button"
      buttonStyle="outline"
    >
      <Radio.Button value="assigned">指派任务 (12)</Radio.Button>
      <Radio.Button value="intention">意向工匠任务 (2)</Radio.Button>
      <Radio.Button value="autonomous">工匠自主任务 (8)</Radio.Button>
    </Radio.Group>
  )

  return (
    <SmartListTemplate
      title="培训任务管理"
      fields={fields}
      dataSource={dataSource}
      loading={loading}
      pagination={pagination}
      filterParams={filterParams}
      onFilterParamsChange={setFilterParams}
      onSearch={(data) => fetchData(data)}
      onReset={() => {
        setFilterParams({})
        fetchData({})
      }}
      toolbarActions={toolbarActions}
      toolbarRightActions={toolbarRightActions}
      columnFields={columnFields}
      defaultColumnFields={defaultColumnFields}
      onColumnSettingsChange={handleColumnSettingsChange}
      onColumnSettingsReset={handleColumnSettingsReset}
      onRefresh={refresh}
      bodyCell={bodyCell}
    />
  )
}
