import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag, Space } from 'antd'
import {
  CompanyButton,
  CompanyMessage,
  ActionCell,
  SvgIcon,
} from '@donglegeyu/company-ui'
import ListPageTemplate from '@/components/ListPageTemplate'
import type { FilterItem } from '@/types'
import { API_ENDPOINTS } from '@/constants/api'
import { useListData, useStatusMap, useDateFormat, useActions } from '@/hooks'

type RecordType = Record<string, unknown>

const filterItems: FilterItem[] = [
  { key: 'orderNo', label: '订单编号', type: 'input', placeholder: '请输入订单编号' },
  { key: 'supplierName', label: '供应商', type: 'input', placeholder: '请输入供应商名称' },
  {
    key: 'status', label: '状态', type: 'select',
    options: [
      { label: '全部', value: '' },
      { label: '草稿', value: 'draft' },
      { label: '审核中', value: 'pending' },
      { label: '已通过', value: 'approved' },
      { label: '已拒绝', value: 'rejected' },
      { label: '已关闭', value: 'closed' },
    ],
  },
  { key: 'dateRange', label: '下单日期', type: 'daterange' },
]

const columns = [
  { title: '订单编号', dataIndex: 'orderNo', key: 'orderNo', width: 150, fixed: 'left' as const },
  { title: '供应商', dataIndex: 'supplierName', key: 'supplierName', width: 180 },
  { title: '联系人', dataIndex: 'contactPerson', key: 'contactPerson', width: 100 },
  { title: '联系电话', dataIndex: 'contactPhone', key: 'contactPhone', width: 130 },
  { title: '订单金额', dataIndex: 'orderAmount', key: 'orderAmount', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '下单日期', dataIndex: 'orderDate', key: 'orderDate', width: 180 },
  { title: '预计交付日期', dataIndex: 'expectedDeliveryDate', key: 'expectedDeliveryDate', width: 180 },
  { title: '操作', dataIndex: 'action', key: 'action', width: 168, fixed: 'right' as const },
]

export default function PurchaseOrderList() {
  const navigate = useNavigate()

  const { registerStatusMap, getStatusText, getStatusColor } = useStatusMap()

  useEffect(() => {
    registerStatusMap({
      draft: { text: '草稿', color: 'default' },
      pending: { text: '审核中', color: 'status-pending' },
      approved: { text: '已通过', color: 'status-approved' },
      rejected: { text: '已拒绝', color: 'status-rejected' },
      closed: { text: '已关闭', color: 'default' },
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { formatDateTime } = useDateFormat()

  const { loading, dataSource, pagination, filterParams, setFilterParams, fetchData, refresh } = useListData({
    apiEndpoint: API_ENDPOINTS.PURCHASE_ORDERS,
    defaultPageSize: 100,
  })

  const { getActionButtons } = useActions({
    detailPath: '/purchase-order',
    editPath: '/purchase-order',
    deleteApi: API_ENDPOINTS.PURCHASE_ORDERS,
    onSubmit: useCallback(async (record: RecordType) => {
      try {
        const res = await fetch(`${API_ENDPOINTS.PURCHASE_ORDERS}/${record.id}/submit`, {
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
    }, [refresh]),
    onDeleteSuccess: useCallback(() => {
      CompanyMessage.success('删除成功')
      refresh()
    }, [refresh]),
  })

  const bodyCellRender = useCallback(
    (column: Record<string, unknown>, record: RecordType) => {
      if (column.key === 'status') {
        return (
          <Tag className={getStatusColor(record.status as string)}>
            {getStatusText(record.status as string)}
          </Tag>
        )
      }
      if (column.key === 'orderAmount') {
        const amount = record.orderAmount as number
        return <>{amount != null ? `¥${amount.toLocaleString()}` : '-'}</>
      }
      if (column.key === 'orderDate' || column.key === 'expectedDeliveryDate') {
        return <>{formatDateTime(record[column.key as string] as string)}</>
      }
      if (column.key === 'action') {
        const actionButtons = getActionButtons(record).map((btn) => ({
          key: btn.key,
          label: btn.label,
          danger: btn.danger,
          confirm: btn.confirm,
          confirmTitle: btn.confirmTitle,
          onClick: () => btn.onClick?.(record),
        }))
        return <ActionCell buttons={actionButtons} />
      }
      return null
    },
    [getStatusText, getStatusColor, formatDateTime, getActionButtons]
  )

  const toolbarActions = (
    <Space size={12}>
      <CompanyButton type="primary" onClick={() => navigate('/purchase-order/create')}>
        新增
      </CompanyButton>
      <CompanyButton disabled onClick={() => CompanyMessage.info('批量导出功能开发中')}>
        批量导出
      </CompanyButton>
      <CompanyButton disabled onClick={() => CompanyMessage.info('批量导入功能开发中')}>
        批量导入
      </CompanyButton>
      <CompanyButton disabled onClick={() => CompanyMessage.info('设置功能开发中')}>
        设置
      </CompanyButton>
      <CompanyButton
        onClick={refresh}
        style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
      >
        <SvgIcon href="refresh" size={16} />
      </CompanyButton>
    </Space>
  )

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ListPageTemplate
      title="采购订单列表"
      filterItems={filterItems}
      columns={columns}
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
      bodyCellRender={bodyCellRender}
    />
  )
}
