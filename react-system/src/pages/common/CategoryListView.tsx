import { useEffect, useCallback, useState } from 'react'
import { Tag, Space } from 'antd'
import {
  CompanyButton,
  CompanyMessage,
  SmartListTemplate,
  ActionCell,
  type FieldDefinition,
  type ColumnField,
} from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'
import { useListData, useStatusMap, useDateFormat } from '@/hooks'
import { useColumnSettings } from '@/hooks/useColumnSettings'

const fields: FieldDefinition[] = [
  { key: 'categoryName', label: '分类名称', type: 'input', width: 180, fixed: 'left' },
  { key: 'categoryCode', label: '分类编码', type: 'input', width: 150 },
  { key: 'parentCategory', label: '上级分类', type: 'select', width: 150, options: [
    { label: '全部', value: '' },
  ]},
  { key: 'sortOrder', label: '排序', type: 'input', width: 100 },
  { key: 'status', label: '状态', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '启用', value: 'enabled' },
    { label: '禁用', value: 'disabled' },
  ]},
  { key: 'createTime', label: '创建时间', type: 'daterange', width: 220 },
  { key: 'action', label: '操作', width: 148, fixed: 'right' },
]

const defaultColumnFields: ColumnField[] = [
  { key: 'categoryName', label: '分类名称', visible: true, width: 180, fixed: 'left' },
  { key: 'categoryCode', label: '分类编码', visible: true, width: 150 },
  { key: 'parentCategory', label: '上级分类', visible: true, width: 150 },
  { key: 'sortOrder', label: '排序', visible: true, width: 100 },
  { key: 'status', label: '状态', visible: true, width: 100 },
  { key: 'createTime', label: '创建时间', visible: true, width: 220 },
]

export default function CategoryListView() {
  const { registerStatusMap, getStatusText, getStatusColor } = useStatusMap()

  const { formatDateTime } = useDateFormat()

  const { loading, dataSource, pagination, filterParams, setFilterParams, fetchData, refresh } = useListData({
    apiEndpoint: API_ENDPOINTS.MATERIALS,
    defaultPageSize: 100,
  })

  const columnSettings = useColumnSettings<ColumnField>({
    pageKey: 'category-list',
    storageType: 'api',
    apiEndpoint: API_ENDPOINTS.USER_PREFERENCES,
  })

  const [columnFields, setColumnFields] = useState<ColumnField[]>(defaultColumnFields)

  useEffect(() => {
    columnSettings.initFields(defaultColumnFields)
    registerStatusMap({
      enabled: { text: '启用', color: 'status-approved' },
      disabled: { text: '禁用', color: 'status-rejected' },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    columnSettings.loadFromStorage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setColumnFields(columnSettings.columnFields)
  }, [columnSettings.columnFields])

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

  const handleColumnSettingsChange = useCallback((newColumnFields: ColumnField[]) => {
    columnSettings.confirmChanges(newColumnFields)
    CompanyMessage.success('列设置已保存')
  }, [columnSettings])

  const handleColumnSettingsReset = useCallback(() => {
    columnSettings.resetToDefault()
    CompanyMessage.success('列设置已重置')
  }, [columnSettings])

  const handleAdd = useCallback(() => {
    CompanyMessage.info('新增功能开发中')
  }, [])

  const toolbarActions = (
    <Space size={12}>
      <CompanyButton type="primary" onClick={handleAdd}>
        新增
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
      if (column.key === 'createTime') {
        return <>{formatDateTime(record[column.key as string] as string)}</>
      }
      if (column.key === 'action') {
        const buttons = [
          { key: 'detail', label: '详情', onClick: () => CompanyMessage.info('详情功能开发中') },
          { key: 'edit', label: '编辑', onClick: () => CompanyMessage.info('编辑功能开发中') },
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
    [getStatusText, getStatusColor, formatDateTime, handleDelete]
  )

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <SmartListTemplate
      title="分类列表"
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
      columnFields={columnFields}
      defaultColumnFields={defaultColumnFields}
      onColumnSettingsChange={handleColumnSettingsChange}
      onColumnSettingsReset={handleColumnSettingsReset}
      onRefresh={refresh}
    />
  )
}
