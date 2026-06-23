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

interface CourseRecord {
  [key: string]: unknown
  id: number
  courseCode: string
  courseName: string
  duration: string
  coursewareType: string
  courseStatus: string
  approvalStatus: string
  targetAudience: string
  category: string
  skill: string
  productCategory: string
  productBrand: string
  learnCount: number
  examPaperBound: string
  createdBy: string
  createdTime: string
}

// 课件类型映射
const coursewareTypeMap: Record<string, string> = {
  video: '视频',
  document: '文档',
}

// 课程状态配置
const courseStatusMap: Record<string, { text: string; color: string }> = {
  published: { text: '上架', color: 'success' },
  unpublished: { text: '下架', color: 'error' },
  draft: { text: '草稿', color: 'warning' },
}

// 审批状态配置
const approvalStatusMap: Record<string, { text: string; color: string }> = {
  approved: { text: '审批通过', color: 'success' },
  rejected: { text: '审批拒绝', color: 'error' },
  reviewing: { text: '审批中', color: 'processing' },
}

// 绑定试卷配置
const examPaperBoundMap: Record<string, { text: string; color: string }> = {
  bound: { text: '已绑定', color: 'warning' },
  unbound: { text: '未绑定', color: 'default' },
}

// 课程分类选项
const categoryOptions = [
  { label: '全部', value: '' },
  { label: '产品培训', value: 'product_training' },
  { label: '技能培训', value: 'skill_training' },
  { label: '新人必学', value: 'newcomer_required' },
  { label: '服务规范', value: 'service_standard' },
]

// 服务技能选项
const skillOptions = [
  { label: '全部', value: '' },
  { label: '安装', value: 'install' },
  { label: '维修', value: 'repair' },
  { label: '基础', value: 'basic' },
  { label: '清洗', value: 'cleaning' },
]

const fields: FieldDefinition[] = [
  { key: 'courseCode', label: '课程编码', type: 'input', width: 140, fixed: 'left' },
  { key: 'courseName', label: '课程名称', type: 'input', width: 150 },
  { key: 'duration', label: '课程时长', type: 'input', width: 98 },
  { key: 'coursewareType', label: '课件类型', type: 'select', width: 98, options: [
    { label: '全部', value: '' },
    { label: '视频', value: 'video' },
    { label: '文档', value: 'document' },
  ]},
  { key: 'courseStatus', label: '课程状态', type: 'select', width: 98, options: [
    { label: '全部', value: '' },
    { label: '上架', value: 'published' },
    { label: '下架', value: 'unpublished' },
    { label: '草稿', value: 'draft' },
  ]},
  { key: 'approvalStatus', label: '审批状态', type: 'select', width: 98, options: [
    { label: '全部', value: '' },
    { label: '审批通过', value: 'approved' },
    { label: '审批拒绝', value: 'rejected' },
    { label: '审批中', value: 'reviewing' },
  ]},
  { key: 'targetAudience', label: '课程对象', type: 'input', width: 98 },
  { key: 'category', label: '课程分类', type: 'select', width: 98, options: categoryOptions },
  { key: 'skill', label: '服务技能', type: 'select', width: 98, options: skillOptions },
  { key: 'productCategory', label: '产品品类', type: 'input', width: 98 },
  { key: 'productBrand', label: '产品品牌', type: 'input', width: 98 },
  { key: 'learnCount', label: '学习人数', type: 'input', width: 98, hideInFilter: true },
  { key: 'examPaperBound', label: '绑定试卷', type: 'select', width: 98, options: [
    { label: '全部', value: '' },
    { label: '已绑定', value: 'bound' },
    { label: '未绑定', value: 'unbound' },
  ]},
  { key: 'createdBy', label: '创建人', type: 'input', width: 98 },
  { key: 'createdTime', label: '创建时间', type: 'input', width: 155 },
  { key: 'action', label: '操作', width: 180, fixed: 'right' },
]

const defaultColumnFields: ColumnField[] = [
  { key: 'courseCode', label: '课程编码', visible: true, width: 140, fixed: 'left' },
  { key: 'courseName', label: '课程名称', visible: true, width: 150 },
  { key: 'duration', label: '课程时长', visible: true, width: 98 },
  { key: 'coursewareType', label: '课件类型', visible: true, width: 98 },
  { key: 'courseStatus', label: '课程状态', visible: true, width: 98 },
  { key: 'approvalStatus', label: '审批状态', visible: true, width: 98 },
  { key: 'targetAudience', label: '课程对象', visible: true, width: 98 },
  { key: 'category', label: '课程分类', visible: true, width: 98 },
  { key: 'skill', label: '服务技能', visible: true, width: 98 },
  { key: 'productCategory', label: '产品品类', visible: true, width: 98 },
  { key: 'productBrand', label: '产品品牌', visible: true, width: 98 },
  { key: 'learnCount', label: '学习人数', visible: true, width: 98 },
  { key: 'examPaperBound', label: '绑定试卷', visible: true, width: 98 },
  { key: 'createdBy', label: '创建人', visible: true, width: 98 },
  { key: 'createdTime', label: '创建时间', visible: true, width: 155 },
]

export default function CourseManage() {
  const { modal } = App.useApp()
  const { loading, dataSource, pagination, filterParams, setFilterParams, fetchData, refresh } = useListData<CourseRecord>({
    apiEndpoint: API_ENDPOINTS.COURSES,
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
    CompanyMessage.info('新增课程功能开发中')
  }, [])

  // 查看详情
  const handleDetail = useCallback((record: CourseRecord) => {
    CompanyMessage.info(`查看课程详情：${record.courseName}`)
  }, [])

  // 编辑
  const handleEdit = useCallback((record: CourseRecord) => {
    CompanyMessage.info(`编辑课程：${record.courseName}`)
  }, [])

  // 上架/下架
  const handleToggleStatus = useCallback((record: CourseRecord) => {
    const isPublished = record.courseStatus === 'published'
    modal.confirm({
      title: `确认要${isPublished ? '下架' : '上架'}该课程吗？`,
      content: `课程「${record.courseName}」${isPublished ? '下架后' : '上架后'}将${isPublished ? '不再对学员展示' : '对学员展示'}。是否确定执行？`,
      okText: '确定',
      cancelText: '取消',
      centered: true,
      width: 400,
      onOk: async () => {
        try {
          const res = await fetch(`${API_ENDPOINTS.COURSES}/${record.id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: isPublished ? 'unpublished' : 'published' }),
          })
          const json = await res.json()
          if (json.code === 200) {
            CompanyMessage.success(`${isPublished ? '下架' : '上架'}成功`)
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
  const handleDelete = useCallback(async (record: CourseRecord) => {
    modal.confirm({
      title: '确认要删除该课程吗？',
      content: `课程「${record.courseName}」删除后数据将永久消失，无法恢复。是否确定执行删除操作？`,
      okText: '确定',
      cancelText: '取消',
      centered: true,
      width: 400,
      onOk: async () => {
        try {
          const res = await fetch(`${API_ENDPOINTS.COURSES}/${record.id}`, {
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
  const handleSubmitApproval = useCallback((record: CourseRecord) => {
    modal.confirm({
      title: '确认要提交审批吗？',
      content: `课程「${record.courseName}」将进入审批流程。是否确定提交？`,
      okText: '确定',
      cancelText: '取消',
      centered: true,
      width: 400,
      onOk: async () => {
        try {
          const res = await fetch(`${API_ENDPOINTS.COURSES}/${record.id}/submit-approval`, {
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
      const r = record as unknown as CourseRecord

      // 课件类型
      if (column.key === 'coursewareType') {
        return <span>{coursewareTypeMap[r.coursewareType as string] || r.coursewareType}</span>
      }

      // 课程状态（Tag）
      if (column.key === 'courseStatus') {
        const status = courseStatusMap[r.courseStatus as string]
        return status ? <Tag color={status.color}>{status.text}</Tag> : <span>-</span>
      }

      // 审批状态（Tag）
      if (column.key === 'approvalStatus') {
        const status = approvalStatusMap[r.approvalStatus as string]
        return status ? <Tag color={status.color}>{status.text}</Tag> : <span>-</span>
      }

      // 课程分类
      if (column.key === 'category') {
        const option = categoryOptions.find((o) => o.value === r.category)
        return <span>{option?.label || r.category || '-'}</span>
      }

      // 服务技能
      if (column.key === 'skill') {
        const option = skillOptions.find((o) => o.value === r.skill)
        return <span>{option?.label || r.skill || '-'}</span>
      }

      // 绑定试卷（Tag）
      if (column.key === 'examPaperBound') {
        const bound = examPaperBoundMap[r.examPaperBound as string]
        return bound ? <Tag color={bound.color}>{bound.text}</Tag> : <span>-</span>
      }

      // 操作列
      if (column.key === 'action') {
        const buttons: Array<{ key: string; label: string; onClick?: () => void; danger?: boolean }> = [
          { key: 'detail', label: '详情', onClick: () => handleDetail(r) },
        ]

        // 上架状态显示"下架"按钮，其他状态根据条件显示
        if (r.courseStatus === 'published') {
          buttons.push({ key: 'unpublish', label: '下架', onClick: () => handleToggleStatus(r) })
        }
        if (r.courseStatus !== 'published') {
          buttons.push({ key: 'edit', label: '编辑', onClick: () => handleEdit(r) })
        }

        // 草稿和审批拒绝状态可以删除
        if (r.courseStatus === 'draft' || r.approvalStatus === 'rejected') {
          buttons.push({ key: 'delete', label: '删除', danger: true, onClick: () => handleDelete(r) })
        }

        // 草稿状态可提交审批，审批拒绝状态可重新提交
        if (r.courseStatus === 'draft' || r.approvalStatus === 'rejected') {
          buttons.push({ key: 'submit', label: '提交审批', onClick: () => handleSubmitApproval(r) })
        }

        return <ActionCell buttons={buttons} />
      }

      return null
    },
    [handleDetail, handleEdit, handleToggleStatus, handleDelete, handleSubmitApproval],
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
      title="课程管理"
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
