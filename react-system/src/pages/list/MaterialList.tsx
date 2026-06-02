import { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag, Menu, Space } from 'antd'
import {
  CompanyButton,
  CompanyDropdown,
  CompanyDrawer,
  CompanyCheckbox,
  CompanyMessage,
} from '@donglegeyu/company-ui'
import SmartListTemplate from '@/components/SmartListTemplate'
import ActionCell from '@/components/ActionCell'
import SvgIcon from '@/components/SvgIcon'
import type { FieldDefinition } from '@/types'
import { API_ENDPOINTS } from '@/constants/api'
import { useListData, useStatusMap, useDateFormat, useColumnSettings } from '@/hooks'

const fields: FieldDefinition[] = [
  { key: 'materialName', label: '材料名称', type: 'input', placeholder: '请输入材料名称', width: 180, fixed: 'left' },
  { key: 'applicationNo', label: '申请单号', type: 'input', placeholder: '请输入申请单号', width: 150 },
  { key: 'status', label: '状态', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '草稿', value: 'draft' },
    { label: '审核中', value: 'pending' },
    { label: '已通过', value: 'approved' },
    { label: '已拒绝', value: 'rejected' },
  ]},
  { key: 'spec', label: '规格型号', type: 'input', placeholder: '请输入规格型号', width: 120 },
  { key: 'unit', label: '单位', type: 'input', placeholder: '请输入单位', width: 80 },
  { key: 'quantity', label: '申请数量', type: 'input', placeholder: '请输入申请数量', width: 100 },
  { key: 'materialQuantity', label: '材料数量', type: 'input', placeholder: '请输入材料数量', width: 100 },
  { key: 'applicant', label: '申请人', type: 'input', placeholder: '请输入申请人', width: 100 },
  { key: 'department', label: '部门', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '工程部', value: 'engineering' },
    { label: '采购部', value: 'procurement' },
    { label: '财务部', value: 'finance' },
  ]},
  { key: 'applyTime', label: '申请日期', type: 'daterange', width: 220 },
  { key: 'action', label: '操作', width: 148, fixed: 'right' },
]

export default function MaterialList() {
  const navigate = useNavigate()

  const [columnSettingsDrawerVisible, setColumnSettingsDrawerVisible] = useState(false)

  const { registerStatusMap, getStatusText, getStatusColor } = useStatusMap()

  const { formatDateTime } = useDateFormat()

  const { loading, dataSource, pagination, filterParams, setFilterParams, fetchData, refresh } = useListData({
    apiEndpoint: API_ENDPOINTS.MATERIALS,
    defaultPageSize: 100,
  })

  const columnSettings = useColumnSettings({
    pageKey: 'material-list',
    storageType: 'api',
    apiEndpoint: API_ENDPOINTS.USER_PREFERENCES,
  })

  useEffect(() => {
    columnSettings.initFields(
      fields
        .filter((f) => f.key !== 'action')
        .map((f) => ({
          key: f.key,
          label: f.label,
          visible: true,
          width: f.width,
          fixed: f.fixed,
        }))
    )
    registerStatusMap({
      draft: { text: '草稿', color: 'default' },
      pending: { text: '审核中', color: 'status-pending' },
      approved: { text: '已通过', color: 'status-approved' },
      rejected: { text: '已拒绝', color: 'status-rejected' },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    columnSettings.loadFromStorage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = useCallback(async (record: Record<string, unknown>) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.MATERIALS}/${record.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json()
      if (json.code === 200) {
        CompanyMessage.success('提交成功')
        refresh()
      } else {
        CompanyMessage.error(json.message || '提交失败，请稍后重试')
      }
    } catch {
      CompanyMessage.error('提交失败，请稍后重试')
    }
  }, [refresh])

  const handleDelete = useCallback(async (record: Record<string, unknown>) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.MATERIALS}/${record.id}`, {
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
  }, [refresh])

  const handleBatchImport = useCallback(() => {
    CompanyMessage.info('批量导入功能开发中')
  }, [])

  const handleColumnSettingsConfirm = useCallback(() => {
    columnSettings.confirmChanges(columnSettings.columnFields)
    CompanyMessage.success('列设置已保存')
    setColumnSettingsDrawerVisible(false)
  }, [columnSettings])

  const handleExportMenuClick = useCallback((info: { key: string }) => {
    if (info.key === 'export-all') {
      CompanyMessage.info('导出全部')
    } else if (info.key === 'export-selected') {
      CompanyMessage.info('导出选中')
    }
  }, [])

  const toolbarActions = (
    <Space size={12}>
      <CompanyButton type="primary" onClick={() => navigate('/materials/create')}>
        新增
      </CompanyButton>
      <CompanyDropdown
        popupRender={() => (
          <Menu
            onClick={handleExportMenuClick}
            items={[
              { key: 'export-all', label: '导出全部' },
              { key: 'export-selected', label: '导出选中' },
            ]}
          />
        )}
      >
        <CompanyButton style={{ display: 'inline-flex', alignItems: 'center' }}>
          导出
          <SvgIcon href="down" size={16} style={{ marginLeft: 4 }} />
        </CompanyButton>
      </CompanyDropdown>
      <CompanyButton onClick={handleBatchImport}>
        导入
      </CompanyButton>
      <CompanyButton
        onClick={() => setColumnSettingsDrawerVisible(true)}
        style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
      >
        <SvgIcon href="setting" size={16} />
      </CompanyButton>
      <CompanyButton
        onClick={refresh}
        style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
      >
        <SvgIcon href="refresh" size={16} />
      </CompanyButton>
    </Space>
  )

  const bodyCell = useCallback(
    (column: Record<string, unknown>, record: Record<string, unknown>) => {
      if (column.key === 'status') {
        return (
          <Tag className={getStatusColor(record.status as string)}>
            {getStatusText(record.status as string)}
          </Tag>
        )
      }
      if (column.key === 'applyTime' || column.key === 'createTime') {
        return <>{formatDateTime(record[column.key as string] as string)}</>
      }
      if (column.key === 'action') {
        const buttons = [
          { key: 'detail', label: '详情', onClick: () => navigate(`/materials/${record.id}`) },
          { key: 'edit', label: '编辑', onClick: () => navigate(`/materials/${record.id}/edit`) },
          {
            key: 'submit',
            label: '提交',
            onClick: () => handleSubmit(record),
          },
          {
            key: 'delete',
            label: '删除',
            danger: true,
            confirm: true,
            confirmTitle: '确定删除？',
            onClick: () => handleDelete(record),
          },
        ]
        return <ActionCell buttons={buttons} />
      }
      return null
    },
    [navigate, getStatusText, getStatusColor, formatDateTime, handleSubmit, handleDelete]
  )

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <SmartListTemplate
        title="材料申请列表"
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
        viewEndpoint={API_ENDPOINTS.MATERIAL_VIEWS}
        toolbarActions={toolbarActions}
        bodyCell={bodyCell}
      />

      <CompanyDrawer
        open={columnSettingsDrawerVisible}
        title="列设置"
        size={380}
        onClose={() => setColumnSettingsDrawerVisible(false)}
        footer={
          <div style={{ textAlign: 'right' }}>
            <CompanyButton
              style={{ marginRight: 12 }}
              onClick={() => setColumnSettingsDrawerVisible(false)}
            >
              取消
            </CompanyButton>
            <CompanyButton type="primary" onClick={handleColumnSettingsConfirm}>
              保存
            </CompanyButton>
          </div>
        }
      >
        <div>
          {columnSettings.columnFields.map((field) => (
            <div
              key={field.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <CompanyCheckbox
                checked={field.visible}
                onChange={(e) =>
                  columnSettings.updateFieldVisibility(field.key, e.target.checked)
                }
              >
                {field.label}
              </CompanyCheckbox>
            </div>
          ))}
        </div>
      </CompanyDrawer>
    </>
  )
}
