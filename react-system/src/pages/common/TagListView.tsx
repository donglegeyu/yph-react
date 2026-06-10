import { useEffect, useCallback, useState } from 'react'
import { Menu, Space } from 'antd'
import {
  CompanyButton,
  CompanyDropdown,
  CompanyMessage,
  CompanyTag,
  SmartListTemplate,
  ActionCell,
  SvgIcon,
  type FieldDefinition,
  type ColumnField,
} from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'
import { useListData, useDateFormat } from '@/hooks'
import { useColumnSettings } from '@/hooks/useColumnSettings'

const statusColorMap: Record<string, string> = {
  enabled: 'success',
  disabled: 'default',
}

const statusTextMap: Record<string, string> = {
  enabled: '启用',
  disabled: '禁用',
}

const tagTypeTextMap: Record<string, string> = {
  material: '材料标签',
  construction: '施工标签',
  general: '通用标签',
}

const fields: FieldDefinition[] = [
  { key: 'tagName', label: '标签名称', type: 'input', placeholder: '请输入标签名称', width: 180, fixed: 'left' },
  { key: 'tagCode', label: '标签编码', type: 'input', placeholder: '请输入标签编码', width: 150 },
  { key: 'tagType', label: '标签类型', type: 'select', width: 120, options: [
    { label: '全部', value: '' },
    { label: '材料标签', value: 'material' },
    { label: '施工标签', value: 'construction' },
    { label: '通用标签', value: 'general' },
  ]},
  { key: 'status', label: '状态', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '启用', value: 'enabled' },
    { label: '禁用', value: 'disabled' },
  ]},
  { key: 'description', label: '标签描述', type: 'input', placeholder: '请输入标签描述', width: 200 },
  { key: 'refCount', label: '关联数量', type: 'input', placeholder: '请输入关联数量', width: 100 },
  { key: 'createTime', label: '创建时间', type: 'daterange', width: 220 },
  { key: 'updateTime', label: '更新时间', type: 'daterange', width: 220 },
  { key: 'action', label: '操作', width: 148, fixed: 'right' },
]

const defaultColumnFields: ColumnField[] = [
  { key: 'tagName', label: '标签名称', visible: true, width: 180, fixed: 'left' },
  { key: 'tagCode', label: '标签编码', visible: true, width: 150 },
  { key: 'tagType', label: '标签类型', visible: true, width: 120 },
  { key: 'status', label: '状态', visible: true, width: 100 },
  { key: 'description', label: '标签描述', visible: true, width: 200 },
  { key: 'refCount', label: '关联数量', visible: true, width: 100 },
  { key: 'createTime', label: '创建时间', visible: true, width: 220 },
  { key: 'updateTime', label: '更新时间', visible: true, width: 220 },
]

export default function TagListView() {
  const { formatDateTime } = useDateFormat()

  const { loading, dataSource, pagination, filterParams, setFilterParams, fetchData, refresh } = useListData({
    apiEndpoint: API_ENDPOINTS.TAGS,
    defaultPageSize: 100,
  })

  const columnSettings = useColumnSettings<ColumnField>({
    pageKey: 'tag-list',
    storageType: 'api',
    apiEndpoint: API_ENDPOINTS.USER_PREFERENCES,
  })

  const [columnFields, setColumnFields] = useState<ColumnField[]>(defaultColumnFields)

  useEffect(() => {
    columnSettings.initFields(defaultColumnFields)
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
      const res = await fetch(`${API_ENDPOINTS.TAGS}/${record.id}`, {
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

  const handleExportMenuClick = useCallback((info: { key: string }) => {
    if (info.key === 'export-all') {
      CompanyMessage.info('导出全部')
    } else if (info.key === 'export-selected') {
      CompanyMessage.info('导出选中')
    }
  }, [])

  const toolbarActions = (
    <Space size={12}>
      <CompanyButton type="primary" onClick={() => CompanyMessage.info('新增功能开发中')}>
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
    </Space>
  )

  const bodyCell = useCallback(
    (column: Record<string, unknown>, record: Record<string, unknown>) => {
      if (column.key === 'tagType') {
        return <>{tagTypeTextMap[record.tagType as string] || (record.tagType as string)}</>
      }
      if (column.key === 'status') {
        const status = record.status as string
        return (
          <CompanyTag color={statusColorMap[status] || 'default'}>
            {statusTextMap[status] || status}
          </CompanyTag>
        )
      }
      if (column.key === 'createTime' || column.key === 'updateTime') {
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
    [formatDateTime, handleDelete]
  )

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <SmartListTemplate
      title="标签列表"
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
      bodyCell={bodyCell}
      columnFields={columnFields}
      defaultColumnFields={defaultColumnFields}
      onColumnSettingsChange={handleColumnSettingsChange}
      onColumnSettingsReset={handleColumnSettingsReset}
      onRefresh={refresh}
    />
  )
}
