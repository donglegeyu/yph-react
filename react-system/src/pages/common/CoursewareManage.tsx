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
import { useListData, useStatusMap } from '@/hooks'

interface CoursewareRecord {
  [key: string]: unknown
  id: number
  coursewareCode: string
  coursewareName: string
  coursewareType: string
  coursewareStatus: string
  approvalStatus: string
  description: string
  updatedBy: string
  updateTime: string
}

// 课件类型映射
const coursewareTypeMap: Record<string, string> = {
  video: '视频',
  document: '文档',
}

// 课件状态配置
const coursewareStatusMap: Record<string, { text: string; color: string }> = {
  published: { text: '已上线', color: 'status-approved' },
  draft: { text: '草稿', color: 'status-pending' },
}

// 审批状态配置
const approvalStatusMap: Record<string, { text: string; color: string }> = {
  approved: { text: '审批通过', color: 'status-approved' },
  pending_submit: { text: '未提交', color: 'status-default' },
  reviewing: { text: '审批中', color: 'status-processing' },
  rejected: { text: '审批拒绝', color: 'status-rejected' },
}

const fields: FieldDefinition[] = [
  { key: 'coursewareCode', label: '课件编码', type: 'input', width: 170, fixed: 'left' },
  { key: 'coursewareName', label: '课件名称', type: 'input', width: 180 },
  { key: 'coursewareType', label: '课件类型', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '视频', value: 'video' },
    { label: '文档', value: 'document' },
  ]},
  { key: 'coursewareStatus', label: '课件状态', type: 'select', width: 100, options: [
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
  { key: 'description', label: '课件说明', type: 'input', width: 260, hideInFilter: true },
  { key: 'updatedBy', label: '更新人', type: 'input', width: 90 },
  { key: 'updateTime', label: '更新时间', type: 'input', width: 165 },
  { key: 'action', label: '操作', width: 200, fixed: 'right' },
]

const defaultColumnFields: ColumnField[] = [
  { key: 'coursewareCode', label: '课件编码', visible: true, width: 170, fixed: 'left' },
  { key: 'coursewareName', label: '课件名称', visible: true, width: 180 },
  { key: 'coursewareType', label: '课件类型', visible: true, width: 100 },
  { key: 'coursewareStatus', label: '课件状态', visible: true, width: 100 },
  { key: 'approvalStatus', label: '审批状态', visible: true, width: 110 },
  { key: 'description', label: '课件说明', visible: true, width: 260 },
  { key: 'updatedBy', label: '更新人', visible: true, width: 90 },
  { key: 'updateTime', label: '更新时间', visible: true, width: 165 },
]

export default function CoursewareManage() {
  const { modal } = App.useApp()
  const { loading, dataSource, pagination, filterParams, setFilterParams, fetchData, refresh } = useListData<CoursewareRecord>({
    apiEndpoint: API_ENDPOINTS.COURSEWARES,
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
    CompanyMessage.info('新增课件功能开发中')
  }, [])

  // 查看详情
  const handleDetail = useCallback((record: CoursewareRecord) => {
    CompanyMessage.info(`查看课件详情：${record.coursewareName}`)
  }, [])

  // 编辑
  const handleEdit = useCallback((record: CoursewareRecord) => {
    CompanyMessage.info(`编辑课件：${record.coursewareName}`)
  }, [])

  // 删除
  const handleDelete = useCallback(async (record: CoursewareRecord) => {
    modal.confirm({
      title: '确认要删除该课件吗？',
      content: `课件「${record.coursewareName}」删除后数据将永久消失，无法恢复。是否确定执行删除操作？`,
      okText: '确定',
      cancelText: '取消',
      centered: true,
      width: 400,
      onOk: async () => {
        try {
          const res = await fetch(`${API_ENDPOINTS.COURSEWARES}/${record.id}`, {
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
  const handleSubmitApproval = useCallback((record: CoursewareRecord) => {
    modal.confirm({
      title: '确认要提交审批吗？',
      content: `课件「${record.coursewareName}」将进入审批流程。是否确定提交？`,
      okText: '确定',
      cancelText: '取消',
      centered: true,
      width: 400,
      onOk: async () => {
        try {
          const res = await fetch(`${API_ENDPOINTS.COURSEWARES}/${record.id}/submit-approval`, {
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
      const r = record as unknown as CoursewareRecord

      // 课件类型
      if (column.key === 'coursewareType') {
        return <span>{coursewareTypeMap[r.coursewareType] || r.coursewareType}</span>
      }

      // 课件状态（Tag）
      if (column.key === 'coursewareStatus') {
        const status = coursewareStatusMap[r.coursewareStatus as string]
        return status ? <Tag color={status.color === 'status-approved' ? 'success' : status.color === 'status-pending' ? 'warning' : 'default'}>{status.text}</Tag> : <span>-</span>
      }

      // 审批状态（Tag）
      if (column.key === 'approvalStatus') {
        const status = approvalStatusMap[r.approvalStatus as string]
        if (!status) return <span>-</span>
        const colorMap: Record<string, string> = {
          'status-approved': 'success',
          'status-default': 'default',
          'status-processing': 'processing',
          'status-rejected': 'error',
        }
        return <Tag color={colorMap[status.color] || 'default'}>{status.text}</Tag>
      }

      // 操作列
      if (column.key === 'action') {
        const buttons: Array<{ key: string; label: string; onClick?: () => void; danger?: boolean }> = [
          { key: 'detail', label: '详情', onClick: () => handleDetail(r) },
          { key: 'edit', label: '编辑', onClick: () => handleEdit(r) },
        ]

        // 草稿和审批拒绝状态可以删除
        if (r.coursewareStatus === 'draft' || r.approvalStatus === 'rejected') {
          buttons.push({ key: 'delete', label: '删除', danger: true, onClick: () => handleDelete(r) })
        }

        // 草稿状态可提交审批，审批拒绝状态可重新提交
        if (r.coursewareStatus === 'draft' || r.approvalStatus === 'rejected') {
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
      title="课件管理"
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
