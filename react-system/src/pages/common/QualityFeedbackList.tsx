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

interface QualityFeedbackRecord {
  [key: string]: unknown
  id: number
  feedbackCode: string
  feedbackTitle: string
  feedbackType: string
  feedbackStatus: string
  approvalStatus: string
  feedbackTarget: string
  feedbackCategory: string
  serviceSkill: string
  productCategory: string
  productBrand: string
  handlingDuration: string
  involvedCount: number
  relatedWorkOrder: string
  createdBy: string
  createdTime: string
}

const feedbackStatusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待处理', color: 'warning' },
  processing: { text: '处理中', color: 'processing' },
  resolved: { text: '已解决', color: 'success' },
  closed: { text: '已关闭', color: 'default' },
}

const approvalStatusMap: Record<string, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'warning' },
  reviewing: { text: '审批中', color: 'processing' },
  approved: { text: '审批通过', color: 'success' },
  rejected: { text: '审批拒绝', color: 'error' },
}

const feedbackTypeOptions = [
  { label: '全部', value: '' },
  { label: '产品质量', value: 'product_quality' },
  { label: '服务质量', value: 'service_quality' },
  { label: '安装质量', value: 'installation_quality' },
  { label: '售后问题', value: 'after_sales' },
]

const feedbackCategoryOptions = [
  { label: '全部', value: '' },
  { label: '功能缺陷', value: 'function_defect' },
  { label: '外观问题', value: 'appearance' },
  { label: '性能问题', value: 'performance' },
  { label: '其他', value: 'other' },
]

const serviceSkillOptions = [
  { label: '全部', value: '' },
  { label: '安装', value: 'installation' },
  { label: '维修', value: 'repair' },
  { label: '清洗', value: 'cleaning' },
  { label: '基础', value: 'basic' },
]

const productCategoryOptions = [
  { label: '全部', value: '' },
  { label: '大家电', value: 'major_appliance' },
  { label: '小家电', value: 'small_appliance' },
  { label: '安防', value: 'security' },
  { label: '通用', value: 'general' },
]

const productBrandOptions = [
  { label: '全部', value: '' },
  { label: '美的', value: 'midea' },
  { label: '格力', value: 'gree' },
  { label: '中燃宝', value: 'zhongranbao' },
  { label: '全部品牌', value: 'all' },
]

const fields: FieldDefinition[] = [
  { key: 'feedbackCode', label: '反馈编码', type: 'input', width: 150, fixed: 'left' },
  { key: 'feedbackTitle', label: '反馈标题', type: 'input', width: 200 },
  { key: 'feedbackType', label: '反馈类型', type: 'select', width: 110, options: feedbackTypeOptions },
  { key: 'handlingDuration', label: '处理时长', type: 'input', width: 100, hideInFilter: true },
  { key: 'feedbackStatus', label: '反馈状态', type: 'select', width: 95, options: [
    { label: '全部', value: '' },
    { label: '待处理', value: 'pending' },
    { label: '处理中', value: 'processing' },
    { label: '已解决', value: 'resolved' },
    { label: '已关闭', value: 'closed' },
  ]},
  { key: 'approvalStatus', label: '审批状态', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '草稿', value: 'draft' },
    { label: '审批中', value: 'reviewing' },
    { label: '审批通过', value: 'approved' },
    { label: '审批拒绝', value: 'rejected' },
  ]},
  { key: 'feedbackTarget', label: '反馈对象', type: 'input', width: 120 },
  { key: 'feedbackCategory', label: '反馈分类', type: 'select', width: 110, options: feedbackCategoryOptions },
  { key: 'serviceSkill', label: '服务技能', type: 'select', width: 100, options: serviceSkillOptions },
  { key: 'productCategory', label: '产品品类', type: 'select', width: 100, options: productCategoryOptions },
  { key: 'productBrand', label: '产品品牌', type: 'select', width: 100, options: productBrandOptions },
  { key: 'involvedCount', label: '涉及数量', type: 'input', width: 90, hideInFilter: true },
  { key: 'relatedWorkOrder', label: '关联工单', type: 'input', width: 120 },
  { key: 'createdBy', label: '创建人', type: 'input', width: 90 },
  { key: 'createdTime', label: '创建时间', type: 'daterange', width: 155 },
  { key: 'action', label: '操作', width: 200, fixed: 'right' },
]

const defaultColumnFields: ColumnField[] = [
  { key: 'feedbackCode', label: '反馈编码', visible: true, width: 150, fixed: 'left' },
  { key: 'feedbackTitle', label: '反馈标题', visible: true, width: 200 },
  { key: 'feedbackType', label: '反馈类型', visible: true, width: 110 },
  { key: 'handlingDuration', label: '处理时长', visible: true, width: 100 },
  { key: 'feedbackStatus', label: '反馈状态', visible: true, width: 95 },
  { key: 'approvalStatus', label: '审批状态', visible: true, width: 100 },
  { key: 'feedbackTarget', label: '反馈对象', visible: true, width: 120 },
  { key: 'feedbackCategory', label: '反馈分类', visible: true, width: 110 },
  { key: 'serviceSkill', label: '服务技能', visible: true, width: 100 },
  { key: 'productCategory', label: '产品品类', visible: true, width: 100 },
  { key: 'productBrand', label: '产品品牌', visible: true, width: 100 },
  { key: 'involvedCount', label: '涉及数量', visible: true, width: 90 },
  { key: 'relatedWorkOrder', label: '关联工单', visible: true, width: 120 },
  { key: 'createdBy', label: '创建人', visible: true, width: 90 },
  { key: 'createdTime', label: '创建时间', visible: true, width: 155 },
]

export default function QualityFeedbackList() {
  const { modal } = App.useApp()
  const { loading, dataSource, pagination, filterParams, setFilterParams, fetchData, refresh } =
    useListData<QualityFeedbackRecord>({
      apiEndpoint: API_ENDPOINTS.QUALITY_FEEDBACKS,
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

  const handleCreate = useCallback(() => {
    CompanyMessage.info('新增品质反馈功能开发中')
  }, [])

  const handleDetail = useCallback((record: QualityFeedbackRecord) => {
    CompanyMessage.info(`查看品质反馈详情：${record.feedbackTitle}`)
  }, [])

  const handleEdit = useCallback((record: QualityFeedbackRecord) => {
    CompanyMessage.info(`编辑品质反馈：${record.feedbackTitle}`)
  }, [])

  const handleDelete = useCallback(async (record: QualityFeedbackRecord) => {
    modal.confirm({
      title: '确认要删除这条反馈吗？',
      content: `反馈「${record.feedbackTitle}」删除后数据将永久消失，无法恢复。是否确定执行删除操作？`,
      okText: '确定',
      cancelText: '取消',
      centered: true,
      width: 400,
      onOk: async () => {
        try {
          const res = await fetch(`${API_ENDPOINTS.QUALITY_FEEDBACKS}/${record.id}`, {
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
  }, [refresh, modal])

  const handleSubmitApproval = useCallback((record: QualityFeedbackRecord) => {
    modal.confirm({
      title: '确认要提交审批吗？',
      content: `品质反馈「${record.feedbackTitle}」将进入审批流程。是否确定提交？`,
      okText: '确定',
      cancelText: '取消',
      centered: true,
      width: 400,
      onOk: async () => {
        try {
          const res = await fetch(`${API_ENDPOINTS.QUALITY_FEEDBACKS}/${record.id}/submit-approval`, {
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
  }, [refresh, modal])

  const bodyCell = useCallback(
    (column: Record<string, unknown>, record: Record<string, unknown>) => {
      const r = record as unknown as QualityFeedbackRecord

      if (column.key === 'feedbackType') {
        const option = feedbackTypeOptions.find((o) => o.value === r.feedbackType)
        return <span>{option?.label || r.feedbackType || '-'}</span>
      }

      if (column.key === 'feedbackCategory') {
        const option = feedbackCategoryOptions.find((o) => o.value === r.feedbackCategory)
        return <span>{option?.label || r.feedbackCategory || '-'}</span>
      }

      if (column.key === 'serviceSkill') {
        const option = serviceSkillOptions.find((o) => o.value === r.serviceSkill)
        return <span>{option?.label || r.serviceSkill || '-'}</span>
      }

      if (column.key === 'productCategory') {
        const option = productCategoryOptions.find((o) => o.value === r.productCategory)
        return <span>{option?.label || r.productCategory || '-'}</span>
      }

      if (column.key === 'productBrand') {
        const option = productBrandOptions.find((o) => o.value === r.productBrand)
        return <span>{option?.label || r.productBrand || '-'}</span>
      }

      if (column.key === 'feedbackStatus') {
        const status = feedbackStatusMap[r.feedbackStatus as string]
        return status ? <Tag color={status.color}>{status.text}</Tag> : <span>-</span>
      }

      if (column.key === 'approvalStatus') {
        const status = approvalStatusMap[r.approvalStatus as string]
        return status ? <Tag color={status.color}>{status.text}</Tag> : <span>-</span>
      }

      if (column.key === 'relatedWorkOrder') {
        return r.relatedWorkOrder ? (
          <span style={{ color: '#1677ff', cursor: 'pointer' }}>{r.relatedWorkOrder}</span>
        ) : (
          <span>-</span>
        )
      }

      if (column.key === 'action') {
        const buttons: Array<{ key: string; label: string; onClick?: () => void; danger?: boolean }> = [
          { key: 'detail', label: '详情', onClick: () => handleDetail(r) },
        ]

        if (r.approvalStatus === 'draft' || r.feedbackStatus === 'pending') {
          buttons.push({ key: 'edit', label: '编辑', onClick: () => handleEdit(r) })
        }

        if (r.approvalStatus === 'draft') {
          buttons.push({ key: 'submit', label: '提交审批', onClick: () => handleSubmitApproval(r) })
        }

        if (r.approvalStatus === 'draft' || r.feedbackStatus === 'pending') {
          buttons.push({ key: 'delete', label: '删除', danger: true, onClick: () => handleDelete(r) })
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
      title="品质反馈申请列表"
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
