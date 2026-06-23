import { useEffect, useCallback, useState } from 'react'
import { Tag, Space, App } from 'antd'
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

interface ExamPaperRecord {
  [key: string]: unknown
  id: number
  paperCode: string
  paperName: string
  category: string
  questionCount: number
  totalScore: number
  passingScore: number
  retakeCount: number
  duration: number
  status: string
  approvalStatus: string
  updatedBy: string
  updateTime: string
}

// 试卷分类映射
const categoryMap: Record<string, string> = {
  theory: '理论知识',
  practice: '实操技能',
  safety: '安全规范',
}

// 试卷状态配置
const statusMap: Record<string, { text: string; color: string }> = {
  published: { text: '已上线', color: 'success' },
  draft: { text: '草稿', color: 'warning' },
  reviewing: { text: '审批中', color: 'processing' },
}

// 审批状态配置
const approvalStatusMap: Record<string, { text: string; color: string }> = {
  approved: { text: '审批通过', color: 'success' },
  pending_submit: { text: '未提交', color: 'default' },
  reviewing: { text: '审批中', color: 'processing' },
  rejected: { text: '审批拒绝', color: 'error' },
}

const fields: FieldDefinition[] = [
  { key: 'paperCode', label: '试卷编码', type: 'input', width: 160, fixed: 'left' },
  { key: 'paperName', label: '试卷名称', type: 'input', width: 180 },
  { key: 'category', label: '试卷分类', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '理论知识', value: 'theory' },
    { label: '实操技能', value: 'practice' },
    { label: '安全规范', value: 'safety' },
  ]},
  { key: 'questionCount', label: '试题数量', type: 'input', width: 90 },
  { key: 'totalScore', label: '试卷总分', type: 'input', width: 90 },
  { key: 'passingScore', label: '合格分数线', type: 'input', width: 100 },
  { key: 'retakeCount', label: '补考次数', type: 'input', width: 90 },
  { key: 'duration', label: '试卷时长', type: 'input', width: 90 },
  { key: 'status', label: '试卷状态', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '已上线', value: 'published' },
    { label: '草稿', value: 'draft' },
    { label: '审批中', value: 'reviewing' },
  ]},
  { key: 'approvalStatus', label: '审批状态', type: 'select', width: 110, options: [
    { label: '全部', value: '' },
    { label: '审批通过', value: 'approved' },
    { label: '未提交', value: 'pending_submit' },
    { label: '审批中', value: 'reviewing' },
    { label: '审批拒绝', value: 'rejected' },
  ]},
  { key: 'updatedBy', label: '更新人', type: 'input', width: 90 },
  { key: 'updateTime', label: '更新时间', type: 'input', width: 165 },
  { key: 'action', label: '操作', width: 240, fixed: 'right' },
]

const defaultColumnFields: ColumnField[] = [
  { key: 'paperCode', label: '试卷编码', visible: true, width: 160, fixed: 'left' },
  { key: 'paperName', label: '试卷名称', visible: true, width: 180 },
  { key: 'category', label: '试卷分类', visible: true, width: 100 },
  { key: 'questionCount', label: '试题数量', visible: true, width: 90 },
  { key: 'totalScore', label: '试卷总分', visible: true, width: 90 },
  { key: 'passingScore', label: '合格分数线', visible: true, width: 100 },
  { key: 'retakeCount', label: '补考次数', visible: true, width: 90 },
  { key: 'duration', label: '试卷时长', visible: true, width: 90 },
  { key: 'status', label: '试卷状态', visible: true, width: 100 },
  { key: 'approvalStatus', label: '审批状态', visible: true, width: 110 },
  { key: 'updatedBy', label: '更新人', visible: true, width: 90 },
  { key: 'updateTime', label: '更新时间', visible: true, width: 165 },
]

export default function ExamPaperList() {
  const { modal } = App.useApp()
  const { loading, dataSource, pagination, filterParams, setFilterParams, fetchData, refresh } = useListData<ExamPaperRecord>({
    apiEndpoint: API_ENDPOINTS.EXAM_PAPERS,
    defaultPageSize: 20,
  })

  const [columnFields, setColumnFields] = useState<ColumnField[]>(defaultColumnFields)

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
    CompanyMessage.info('新增试卷功能开发中')
  }, [])

  // 查看详情
  const handleDetail = useCallback((record: ExamPaperRecord) => {
    CompanyMessage.info(`查看试卷详情：${record.paperName}`)
  }, [])

  // 编辑
  const handleEdit = useCallback((record: ExamPaperRecord) => {
    CompanyMessage.info(`编辑试卷：${record.paperName}`)
  }, [])

  // 删除
  const handleDelete = useCallback(async (record: ExamPaperRecord) => {
    modal.confirm({
      title: '确认要删除该试卷吗？',
      content: `试卷「${record.paperName}」删除后数据将永久消失，无法恢复。是否确定执行删除操作？`,
      okText: '确定',
      cancelText: '取消',
      centered: true,
      width: 400,
      onOk: async () => {
        try {
          const res = await fetch(`${API_ENDPOINTS.EXAM_PAPERS}/${record.id}`, {
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
  const handleSubmitApproval = useCallback((record: ExamPaperRecord) => {
    modal.confirm({
      title: '确认要提交审批吗？',
      content: `试卷「${record.paperName}」将进入审批流程。是否确定提交？`,
      okText: '确定',
      cancelText: '取消',
      centered: true,
      width: 400,
      onOk: async () => {
        try {
          const res = await fetch(`${API_ENDPOINTS.EXAM_PAPERS}/${record.id}/submit-approval`, {
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
      const r = record as unknown as ExamPaperRecord

      // 试卷分类
      if (column.key === 'category') {
        return <span>{categoryMap[r.category as string] || r.category}</span>
      }

      // 试题数量（带"题"单位）
      if (column.key === 'questionCount') {
        return <span>{r.questionCount}题</span>
      }

      // 试卷时长（带"分钟"单位）
      if (column.key === 'duration') {
        return <span>{r.duration}分钟</span>
      }

      // 试卷状态（Tag）
      if (column.key === 'status') {
        const status = statusMap[r.status as string]
        return status ? <Tag color={status.color}>{status.text}</Tag> : <span>-</span>
      }

      // 审批状态（Tag）
      if (column.key === 'approvalStatus') {
        const status = approvalStatusMap[r.approvalStatus as string]
        if (!status) return <span>-</span>
        return <Tag color={status.color}>{status.text}</Tag>
      }

      // 操作列 - 根据状态动态显示按钮
      if (column.key === 'action') {
        const buttons: Array<{ key: string; label: string; onClick?: () => void; danger?: boolean }> = [
          { key: 'detail', label: '详情', onClick: () => handleDetail(r) },
        ]

        // 草稿/审批拒绝 状态可编辑、删除、提交审批
        if (r.status === 'draft' || r.approvalStatus === 'rejected') {
          buttons.push({ key: 'edit', label: '编辑', onClick: () => handleEdit(r) })
          buttons.push({ key: 'delete', label: '删除', danger: true, onClick: () => handleDelete(r) })
          buttons.push({ key: 'submit', label: '提交审批', onClick: () => handleSubmitApproval(r) })
        }

        return <ActionCell buttons={buttons} />
      }

      return null
    },
    [handleDetail, handleEdit, handleDelete, handleSubmitApproval],
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

  return (
    <SmartListTemplate
      title="试卷管理"
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
      columnFields={columnFields}
      defaultColumnFields={defaultColumnFields}
      onColumnSettingsChange={handleColumnSettingsChange}
      onColumnSettingsReset={handleColumnSettingsReset}
      onRefresh={refresh}
      bodyCell={bodyCell}
    />
  )
}
