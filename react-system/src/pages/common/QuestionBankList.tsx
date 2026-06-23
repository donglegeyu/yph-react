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

interface QuestionBankRecord {
  [key: string]: unknown
  id: number
  questionBankCode: string
  questionBankName: string
  category: string
  status: string
  approvalStatus: string
  updatedBy: string
  updateTime: string
}

// 题库分类映射
const categoryMap: Record<string, string> = {
  theory: '理论知识',
  practice: '实操技能',
  safety: '安全规范',
  service: '服务规范',
}

// 题库状态配置
const statusMap: Record<string, { text: string; color: string }> = {
  published: { text: '已上线', color: 'success' },
  draft: { text: '草稿', color: 'warning' },
}

// 审批状态配置
const approvalStatusMap: Record<string, { text: string; color: string }> = {
  approved: { text: '审批通过', color: 'success' },
  pending_submit: { text: '未提交', color: 'default' },
  reviewing: { text: '审批中', color: 'processing' },
  rejected: { text: '审批拒绝', color: 'error' },
}

const fields: FieldDefinition[] = [
  { key: 'questionBankCode', label: '题库编码', type: 'input', width: 170, fixed: 'left' },
  { key: 'questionBankName', label: '题库名称', type: 'input', width: 180 },
  { key: 'category', label: '题库分类', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '理论知识', value: 'theory' },
    { label: '实操技能', value: 'practice' },
    { label: '安全规范', value: 'safety' },
    { label: '服务规范', value: 'service' },
  ]},
  { key: 'status', label: '题库状态', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '已上线', value: 'published' },
    { label: '草稿', value: 'draft' },
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
  { key: 'action', label: '操作', width: 220, fixed: 'right' },
]

const defaultColumnFields: ColumnField[] = [
  { key: 'questionBankCode', label: '题库编码', visible: true, width: 170, fixed: 'left' },
  { key: 'questionBankName', label: '题库名称', visible: true, width: 180 },
  { key: 'category', label: '题库分类', visible: true, width: 100 },
  { key: 'status', label: '题库状态', visible: true, width: 100 },
  { key: 'approvalStatus', label: '审批状态', visible: true, width: 110 },
  { key: 'updatedBy', label: '更新人', visible: true, width: 90 },
  { key: 'updateTime', label: '更新时间', visible: true, width: 165 },
]

export default function QuestionBankList() {
  const { modal } = App.useApp()
  const { loading, dataSource, pagination, filterParams, setFilterParams, fetchData, refresh } = useListData<QuestionBankRecord>({
    apiEndpoint: API_ENDPOINTS.QUESTION_BANKS,
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
    CompanyMessage.info('新增题库功能开发中')
  }, [])

  // 查看详情
  const handleDetail = useCallback((record: QuestionBankRecord) => {
    CompanyMessage.info(`查看题库详情：${record.questionBankName}`)
  }, [])

  // 编辑
  const handleEdit = useCallback((record: QuestionBankRecord) => {
    CompanyMessage.info(`编辑题库：${record.questionBankName}`)
  }, [])

  // 删除
  const handleDelete = useCallback(async (record: QuestionBankRecord) => {
    modal.confirm({
      title: '确认要删除该题库吗？',
      content: `题库「${record.questionBankName}」删除后数据将永久消失，无法恢复。是否确定执行删除操作？`,
      okText: '确定',
      cancelText: '取消',
      centered: true,
      width: 400,
      onOk: async () => {
        try {
          const res = await fetch(`${API_ENDPOINTS.QUESTION_BANKS}/${record.id}`, {
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
  const handleSubmitApproval = useCallback((record: QuestionBankRecord) => {
    modal.confirm({
      title: '确认要提交审批吗？',
      content: `题库「${record.questionBankName}」将进入审批流程。是否确定提交？`,
      okText: '确定',
      cancelText: '取消',
      centered: true,
      width: 400,
      onOk: async () => {
        try {
          const res = await fetch(`${API_ENDPOINTS.QUESTION_BANKS}/${record.id}/submit-approval`, {
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
      const r = record as unknown as QuestionBankRecord

      // 题库分类
      if (column.key === 'category') {
        return <span>{categoryMap[r.category as string] || r.category}</span>
      }

      // 题库状态（Tag）
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

      // 操作列
      if (column.key === 'action') {
        const buttons: Array<{ key: string; label: string; onClick?: () => void; danger?: boolean }> = [
          { key: 'detail', label: '详情', onClick: () => handleDetail(r) },
        ]

        // 草稿和审批拒绝状态可编辑、删除、提交审批
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
      title="题库管理"
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
