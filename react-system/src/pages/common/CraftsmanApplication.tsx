import { useEffect, useCallback, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Tag, Space } from 'antd'
import {
  CompanyButton,
  CompanyMessage,
  SmartListTemplate,
  ActionCell,
  type FieldDefinition,
  type ColumnField,
} from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'
import { SERVICE_PROVIDER_LIST } from '@/constants/serviceProviders'
import { useListData, useStatusMap, useMenuTitle } from '@/hooks'
import './CraftsmanApplication.scss'

interface CraftsmanApplicationRecord {
  [key: string]: unknown
  id: number
  applicationNo: string
  applicationType: string
  status: string
  name: string
  phone: string
  userAccount: string
  serviceProviderName: string
  applicant: string
  applyTime: string
  createTime: string
}

const applicationTypeMap: Record<string, string> = {
  add: '新增',
  edit: '修改',
  delete: '删除',
}

const fields: FieldDefinition[] = [
  { key: 'applicationNo', label: '申请单号', type: 'input', width: 170 },
  { key: 'applicationType', label: '申请单类型', type: 'select', width: 130, options: [
    { label: '全部', value: '' },
    { label: '新增', value: 'add' },
    { label: '修改', value: 'edit' },
    { label: '删除', value: 'delete' },
  ]},
  { key: 'status', label: '申请单状态', type: 'select', width: 130, options: [
    { label: '全部', value: '' },
    { label: '草稿', value: 'draft' },
    { label: '审批中', value: 'pending' },
    { label: '审批通过', value: 'approved' },
    { label: '已驳回', value: 'rejected' },
  ]},
  { key: 'name', label: '姓名', type: 'input', width: 160 },
  { key: 'phone', label: '手机号', type: 'input', width: 130 },
  { key: 'userAccount', label: '用户账号', type: 'input', width: 150 },
  { key: 'serviceProviderName', label: '所属供应商', type: 'select', width: 200, options: [
    { label: '全部', value: '' },
    ...SERVICE_PROVIDER_LIST.map((o) => ({ label: o.name, value: o.name })),
  ]},
  { key: 'applicant', label: '申请人', type: 'input', width: 130 },
  { key: 'applyTime', label: '申请日期', type: 'input', width: 130 },
  { key: 'action', label: '操作', width: 200, fixed: 'right' },
]

const defaultColumnFields: ColumnField[] = [
  { key: 'applicationNo', label: '申请单号', visible: true, width: 170 },
  { key: 'applicationType', label: '申请单类型', visible: true, width: 130 },
  { key: 'status', label: '申请单状态', visible: true, width: 130 },
  { key: 'name', label: '姓名', visible: true, width: 160 },
  { key: 'phone', label: '手机号', visible: true, width: 130 },
  { key: 'userAccount', label: '用户账号', visible: true, width: 150 },
  { key: 'serviceProviderName', label: '所属供应商', visible: true, width: 200 },
  { key: 'applicant', label: '申请人', visible: true, width: 130 },
  { key: 'applyTime', label: '申请日期', visible: true, width: 130 },
]

export default function CraftsmanApplication() {
  const navigate = useNavigate()
  const { modal } = App.useApp()
  const { loading, dataSource, pagination, filterParams, setFilterParams, fetchData, refresh } = useListData<CraftsmanApplicationRecord>({
    apiEndpoint: API_ENDPOINTS.CRAFTSMAN_APPLICATIONS,
    defaultPageSize: 20,
  })

  const { registerStatusMap, getStatusText, getStatusColor } = useStatusMap()
  const menuTitle = useMenuTitle()

  const [columnFields, setColumnFields] = useState<ColumnField[]>(defaultColumnFields)
  const initializedRef = useRef(false)

  const handleColumnSettingsChange = useCallback((fields: ColumnField[]) => {
    const savedKeys = new Set(fields.map((f) => f.key))
    const missingFields = defaultColumnFields.filter((f) => !savedKeys.has(f.key))
    setColumnFields([...fields, ...missingFields])
  }, [])

  const handleColumnSettingsReset = useCallback(() => {
    setColumnFields(defaultColumnFields)
  }, [])

  useEffect(() => {
    registerStatusMap({
      draft: { text: '草稿', color: 'status-draft' },
      pending: { text: '审批中', color: 'status-pending' },
      approved: { text: '审批通过', color: 'status-approved' },
      rejected: { text: '已驳回', color: 'status-rejected' },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    const currentKeys = new Set(columnFields.map((f) => f.key))
    const missingFields = defaultColumnFields.filter((f) => !currentKeys.has(f.key))
    if (missingFields.length > 0) {
      setColumnFields((prev) => [...prev, ...missingFields])
    }
  }, [])

  const showDetail = useCallback((record: CraftsmanApplicationRecord) => {
    navigate(`/craftsman-application/${record.id}`, { state: { from: '/craftsman-application' } })
  }, [navigate])

  const handleStatusChange = useCallback(async (record: CraftsmanApplicationRecord, action: 'submit' | 'revoke' | 'approve') => {
    const actionText = { submit: '提交审批', revoke: '撤回', approve: '审批通过' }[action]
    try {
      const res = await fetch(`${API_ENDPOINTS.CRAFTSMAN_APPLICATIONS}/${record.id}/${action}`, { method: 'PUT' })
      const json = await res.json()
      if (json.code === 200) {
        CompanyMessage.success(`${actionText}成功`)
        refresh()
      } else {
        CompanyMessage.error(json.message || `${actionText}失败`)
      }
    } catch {
      CompanyMessage.error(`${actionText}失败，请稍后重试`)
    }
  }, [refresh])

  const confirmStatusChange = useCallback((record: CraftsmanApplicationRecord, action: 'submit' | 'revoke' | 'approve') => {
    const actionText = { submit: '提交审批', revoke: '撤回', approve: '审批通过' }[action]
    modal.confirm({
      title: `确认要${actionText}吗？`,
      content: action === 'approve' ? '审批通过后该工匠将进入工匠列表。' : `是否确定${actionText}？`,
      okText: '确定',
      cancelText: '取消',
      centered: true,
      onOk: () => handleStatusChange(record, action),
    })
  }, [modal, handleStatusChange])

  const handleDelete = useCallback(async (record: CraftsmanApplicationRecord) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.CRAFTSMAN_APPLICATIONS}/${record.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.code === 200) {
        CompanyMessage.success('删除成功')
        refresh()
      } else {
        CompanyMessage.error(json.message || '删除失败')
      }
    } catch {
      CompanyMessage.error('删除失败，请稍后重试')
    }
  }, [refresh])

  const confirmDelete = useCallback((record: CraftsmanApplicationRecord) => {
    modal.confirm({
      title: '确认要删除该申请单吗？',
      content: '删除后不可恢复，是否继续？',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      centered: true,
      onOk: () => handleDelete(record),
    })
  }, [modal, handleDelete])

  const toolbarActions = (
    <Space size={12}>
      <CompanyButton
        type="primary"
        onClick={() => navigate('/craftsman-application/create', { state: { from: '/craftsman-application', mode: 'application' } })}
      >
        新增工匠
      </CompanyButton>
    </Space>
  )

  const bodyCell = useCallback(
    (column: Record<string, unknown>, record: Record<string, unknown>) => {
      const r = record as unknown as CraftsmanApplicationRecord

      if (column.key === 'applicationType') {
        return <span>{applicationTypeMap[r.applicationType] || r.applicationType}</span>
      }

      if (column.key === 'status') {
        return (
          <Tag className={getStatusColor(r.status)}>
            {getStatusText(r.status)}
          </Tag>
        )
      }

      if (column.key === 'action') {
        const buttons: Array<{ key: string; label: string; danger?: boolean; onClick: () => void }> = [
          {
            key: 'detail',
            label: '详情',
            onClick: () => showDetail(r),
          },
        ]
        // 草稿状态：编辑、提交审批、删除
        if (r.status === 'draft') {
          buttons.push(
            {
              key: 'edit',
              label: '编辑',
              onClick: () => navigate(`/craftsman-application/${r.id}/edit`, { state: { from: '/craftsman-application', mode: 'application' } }),
            },
            {
              key: 'submit',
              label: '提交审批',
              onClick: () => confirmStatusChange(r, 'submit'),
            },
            {
              key: 'delete',
              label: '删除',
              danger: true,
              onClick: () => confirmDelete(r),
            }
          )
        }
        // 已驳回状态：编辑
        if (r.status === 'rejected') {
          buttons.push(
            {
              key: 'edit',
              label: '编辑',
              onClick: () => navigate(`/craftsman-application/${r.id}/edit`, { state: { from: '/craftsman-application', mode: 'application' } }),
            }
          )
        }
        // 审批中状态：审批通过、撤回
        if (r.status === 'pending') {
          buttons.push(
            {
              key: 'approve',
              label: '审批通过',
              onClick: () => confirmStatusChange(r, 'approve'),
            },
            {
              key: 'revoke',
              label: '撤回',
              onClick: () => confirmStatusChange(r, 'revoke'),
            },
          )
        }
        return <ActionCell buttons={buttons} />
      }

      return null
    },
    [getStatusText, getStatusColor, showDetail, navigate, confirmStatusChange, confirmDelete]
  )

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <SmartListTemplate
      title={menuTitle || '工匠申请'}
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
      viewEndpoint={API_ENDPOINTS.CRAFTSMAN_APPLICATION_VIEWS}
      columnFields={columnFields}
      defaultColumnFields={defaultColumnFields}
      onColumnSettingsChange={handleColumnSettingsChange}
      onColumnSettingsReset={handleColumnSettingsReset}
      onRefresh={refresh}
      toolbarActions={toolbarActions}
      bodyCell={bodyCell}
    />
  )
}
