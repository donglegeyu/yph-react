import { useEffect, useCallback, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag, Space, Menu } from 'antd'
import {
  CompanyButton,
  CompanyDropdown,
  CompanyMessage,
  SmartListTemplate,
  ActionCell,
  type FieldDefinition,
  type ColumnField,
} from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'
import { SERVICE_PROVIDER_LIST } from '@/constants/serviceProviders'
import { useListData, useStatusMap, useMenuTitle } from '@/hooks'

interface CraftsmanRecord {
  [key: string]: unknown
  id: number
  craftsmanCode: string
  name: string
  phone: string
  userAccount: string
  serviceProviderName: string
  craftsmanCategory: string
  craftsmanType: number
  region: string
  serviceSkills: string
  registerTime: string
  status: number
  createTime: string
}

const fields: FieldDefinition[] = [
  { key: 'craftsmanCode', label: '工匠编码', type: 'input', width: 150 },
  { key: 'name', label: '姓名', type: 'input', width: 120 },
  { key: 'phone', label: '手机号', type: 'input', width: 130 },
  { key: 'serviceProviderName', label: '所属服务商', type: 'select', width: 180, options: [
    { label: '全部', value: '' },
    ...SERVICE_PROVIDER_LIST.map((o) => ({ label: o.name, value: o.name })),
  ]},
  { key: 'craftsmanCategory', label: '工匠类别', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '外部员工', value: 'outsource' },
    { label: '内部员工', value: 'internal' },
  ]},
  { key: 'craftsmanType', label: '工匠类型', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '正式工匠', value: 1 },
    { label: '意向工匠', value: 2 },
  ]},
  { key: 'status', label: '状态', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '启用', value: 1 },
    { label: '停用', value: 0 },
  ]},
  { key: 'userAccount', label: '用户账号', type: 'input', width: 150 },
  { key: 'serviceSkills', label: '服务技能', type: 'input', width: 150 },
  { key: 'registerTime', label: '注册时间', type: 'input', width: 160 },
  { key: 'action', label: '操作', width: 180, fixed: 'right' },
]

const defaultColumnFields: ColumnField[] = [
  { key: 'craftsmanCode', label: '工匠编码', visible: true, width: 150 },
  { key: 'name', label: '姓名', visible: true, width: 120 },
  { key: 'phone', label: '手机号', visible: true, width: 130 },
  { key: 'serviceProviderName', label: '所属服务商', visible: true, width: 180 },
  { key: 'craftsmanCategory', label: '工匠类别', visible: true, width: 100 },
  { key: 'craftsmanType', label: '工匠类型', visible: true, width: 100 },
  { key: 'status', label: '状态', visible: true, width: 100 },
  { key: 'userAccount', label: '用户账号', visible: true, width: 150 },
  { key: 'serviceSkills', label: '服务技能', visible: true, width: 150 },
  { key: 'registerTime', label: '注册时间', visible: true, width: 160 },
]

const categoryMap: Record<string, string> = {
  outsource: '外部员工',
  internal: '内部员工',
}

const craftsmanTypeMap: Record<number, string> = {
  1: '正式工匠',
  2: '意向工匠',
}

export default function CraftsmanQuery() {
  const navigate = useNavigate()
  const { loading, dataSource, pagination, filterParams, setFilterParams, fetchData, refresh } = useListData<CraftsmanRecord>({
    apiEndpoint: API_ENDPOINTS.CRAFTSMEN,
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

  const handleImportClick = useCallback(({ key }: { key: string }) => {
    if (key === 'import-template') {
      CompanyMessage.info('下载模板功能开发中')
    } else if (key === 'import-data') {
      CompanyMessage.info('导入数据功能开发中')
    }
  }, [])

  const toolbarActions = (
    <Space size={12}>
      <CompanyButton type="primary" onClick={() => navigate('/craftsman-search/create')}>
        新增工匠
      </CompanyButton>
      <CompanyDropdown
        trigger={['click']}
        popupRender={() => (
          <Menu
            onClick={handleImportClick}
            items={[
              { key: 'import-template', label: '下载模板' },
              { key: 'import-data', label: '导入数据' },
            ]}
          />
        )}
      >
        <CompanyButton>导入</CompanyButton>
      </CompanyDropdown>
    </Space>
  )

  const handleToggleStatus = useCallback(async (record: CraftsmanRecord) => {
    const newStatus = record.status === 1 ? 0 : 1
    try {
      const res = await fetch(`${API_ENDPOINTS.CRAFTSMEN}/${record.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (json.code === 200) {
        CompanyMessage.success(newStatus === 1 ? '已启用' : '已禁用')
        refresh()
      } else {
        CompanyMessage.error(json.message || '操作失败，请稍后重试')
      }
    } catch {
      CompanyMessage.error('操作失败，请稍后重试')
    }
  }, [refresh])

  const showDetail = useCallback((record: CraftsmanRecord) => {
    navigate(`/craftsman-search/${record.id}`)
  }, [navigate])

  useEffect(() => {
    registerStatusMap({
      1: { text: '启用', color: 'status-approved' },
      0: { text: '停用', color: 'status-rejected' },
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

  const bodyCell = useCallback(
    (column: Record<string, unknown>, record: Record<string, unknown>) => {
      const craftsmanRecord = record as unknown as CraftsmanRecord

      if (column.key === 'serviceProviderName') {
        return craftsmanRecord.craftsmanCategory === 'external'
          ? <span style={{ color: 'rgba(0,0,0,0.45)' }}>--</span>
          : <span>{craftsmanRecord.serviceProviderName}</span>
      }

      if (column.key === 'craftsmanCategory') {
        return <span>{categoryMap[craftsmanRecord.craftsmanCategory] || craftsmanRecord.craftsmanCategory}</span>
      }

      if (column.key === 'craftsmanType') {
        return <span>{craftsmanTypeMap[craftsmanRecord.craftsmanType] || craftsmanRecord.craftsmanType}</span>
      }

      if (column.key === 'status') {
        return (
          <Tag className={getStatusColor(String(craftsmanRecord.status))}>
            {getStatusText(String(craftsmanRecord.status))}
          </Tag>
        )
      }

      if (column.key === 'action') {
        const toggleLabel = craftsmanRecord.status === 1 ? '停用' : '启用'
        const buttons = [
          {
            key: 'detail',
            label: '详情',
            onClick: () => showDetail(craftsmanRecord),
          },
          {
            key: 'edit',
            label: '编辑',
            onClick: () => CompanyMessage.info('编辑功能开发中'),
          },
          {
            key: 'toggle',
            label: toggleLabel,
            onClick: () => handleToggleStatus(craftsmanRecord),
          },
        ]
        return <ActionCell buttons={buttons} />
      }

      return null
    },
    [getStatusText, getStatusColor, handleToggleStatus, showDetail]
  )

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <SmartListTemplate
        title={menuTitle || '工匠查询'}
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
        viewEndpoint={API_ENDPOINTS.CRAFTSMAN_VIEWS}
        columnFields={columnFields}
        defaultColumnFields={defaultColumnFields}
        onColumnSettingsChange={handleColumnSettingsChange}
        onColumnSettingsReset={handleColumnSettingsReset}
        onRefresh={refresh}
        toolbarActions={toolbarActions}
        bodyCell={bodyCell}
      />
    </>
  )
}
