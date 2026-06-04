import { useEffect, useCallback, useState } from 'react'
import { Tag, Modal, Descriptions } from 'antd'
import {
  CompanyMessage,
  SmartListTemplate,
  ActionCell,
  type FieldDefinition,
  type ColumnField,
} from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'
import { useListData, useStatusMap, useMenuTitle } from '@/hooks'

interface CraftsmanRecord {
  [key: string]: unknown
  id: number
  craftsmanCode: string
  name: string
  phone: string
  userAccount: string
  serviceProviderName: string
  type: string
  region: string
  status: number
  createTime: string
}

const fields: FieldDefinition[] = [
  { key: 'craftsmanCode', label: '工匠编码', type: 'input', placeholder: '请输入工匠编码', width: 150 },
  { key: 'name', label: '姓名', type: 'input', placeholder: '请输入姓名', width: 120 },
  { key: 'status', label: '状态', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 },
  ]},
  { key: 'type', label: '类型', type: 'select', width: 100, options: [
    { label: '全部', value: '' },
    { label: '个人', value: 'person' },
    { label: '服务商', value: 'company' },
  ]},
  { key: 'serviceProviderName', label: '服务商名称', type: 'input', placeholder: '请输入服务商名称', width: 180 },
  { key: 'region', label: '区域', type: 'input', placeholder: '请输入区域', width: 120 },
  { key: 'phone', label: '手机号', type: 'input', placeholder: '请输入手机号', width: 130 },
  { key: 'userAccount', label: '用户账号', type: 'input', placeholder: '请输入用户账号', width: 150 },
  { key: 'action', label: '操作', width: 180, fixed: 'right' },
]

const defaultColumnFields: ColumnField[] = [
  { key: 'craftsmanCode', label: '工匠编码', visible: true, width: 150 },
  { key: 'name', label: '姓名', visible: true, width: 120 },
  { key: 'status', label: '状态', visible: true, width: 100 },
  { key: 'type', label: '类型', visible: true, width: 100 },
  { key: 'serviceProviderName', label: '服务商名称', visible: true, width: 180 },
  { key: 'region', label: '区域', visible: true, width: 120 },
  { key: 'phone', label: '手机号', visible: true, width: 130 },
  { key: 'userAccount', label: '用户账号', visible: true, width: 150 },
]

const typeMap: Record<string, string> = {
  person: '个人',
  company: '服务商',
}

export default function CraftsmanQuery() {
  const { loading, dataSource, pagination, filterParams, setFilterParams, fetchData, refresh } = useListData<CraftsmanRecord>({
    apiEndpoint: API_ENDPOINTS.CRAFTSMEN,
    defaultPageSize: 20,
  })

  const { registerStatusMap, getStatusText, getStatusColor } = useStatusMap()

  const menuTitle = useMenuTitle()

  const [columnFields, setColumnFields] = useState<ColumnField[]>(defaultColumnFields)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentDetail, setCurrentDetail] = useState<CraftsmanRecord | null>(null)

  const handleColumnSettingsChange = useCallback((fields: ColumnField[]) => {
    setColumnFields(fields)
  }, [])

  const handleColumnSettingsReset = useCallback(() => {
    setColumnFields(defaultColumnFields)
  }, [])

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
    setCurrentDetail(record)
    setDetailVisible(true)
  }, [])

  useEffect(() => {
    registerStatusMap({
      1: { text: '启用', color: 'status-approved' },
      0: { text: '禁用', color: 'status-rejected' },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const bodyCell = useCallback(
    (column: Record<string, unknown>, record: Record<string, unknown>) => {
      const craftsmanRecord = record as unknown as CraftsmanRecord

      if (column.key === 'serviceProviderName') {
        return craftsmanRecord.type === 'person'
          ? <span style={{ color: 'rgba(0,0,0,0.45)' }}>--</span>
          : <span>{craftsmanRecord.serviceProviderName}</span>
      }

      if (column.key === 'type') {
        return <span>{typeMap[craftsmanRecord.type] || craftsmanRecord.type}</span>
      }

      if (column.key === 'status') {
        return (
          <Tag className={getStatusColor(String(craftsmanRecord.status))}>
            {getStatusText(String(craftsmanRecord.status))}
          </Tag>
        )
      }

      if (column.key === 'action') {
        const buttons = [
          {
            key: 'detail',
            label: '详情',
            onClick: () => showDetail(craftsmanRecord),
          },
          {
            key: 'toggle',
            label: craftsmanRecord.status === 1 ? '禁用' : '启用',
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
        bodyCell={bodyCell}
      />
      <Modal
        title="工匠详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={520}
      >
        {currentDetail && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="工匠编码">{currentDetail.craftsmanCode}</Descriptions.Item>
            <Descriptions.Item label="姓名">{currentDetail.name}</Descriptions.Item>
            <Descriptions.Item label="手机号">{currentDetail.phone}</Descriptions.Item>
            <Descriptions.Item label="用户账号">{currentDetail.userAccount}</Descriptions.Item>
            <Descriptions.Item label="服务商名称">{currentDetail.type === 'person' ? '--' : currentDetail.serviceProviderName}</Descriptions.Item>
            <Descriptions.Item label="类型">{typeMap[currentDetail.type] || currentDetail.type}</Descriptions.Item>
            <Descriptions.Item label="区域">{currentDetail.region}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag className={getStatusColor(String(currentDetail.status))}>
                {getStatusText(String(currentDetail.status))}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{currentDetail.createTime}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  )
}
