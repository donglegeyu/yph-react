<template>
  <ListPageTemplate
    v-model:filter-model-value="filterParams"
    :filter-items="(filterItems as any)"
    :columns="(columns as any)"
    :data-source="dataSource"
    :loading="loading"
    :title="pageTitle"
    @search="handleSearch"
    @reset="handleReset"
    @add="handleAdd"
  >
    <template #toolbar-actions>
      <a-space :size="12">
        <a-button type="primary" @click="handleAdd">
          新增
        </a-button>
        <a-button @click="handleBatchExport">批量导出</a-button>
        <a-button @click="handleBatchImport">批量导入</a-button>
        <a-button class="icon-only-btn" @click="handleSettings" style="width: 32px; height: 32px;">
          <template #icon><svg viewBox="0 0 48 48" style="width:16px;height:16px"><use href="#setting" /></svg></template>
        </a-button>
        <a-button @click="refresh" class="icon-only-btn" style="width: 32px; height: 32px;">
          <template #icon><svg viewBox="0 0 48 48" style="width:16px;height:16px"><use href="#refresh" /></svg></template>
        </a-button>
      </a-space>
    </template>
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'status'">
        <a-tag :class="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
      </template>
      <template v-else-if="column.key === 'orderAmount'">
        ¥{{ record.orderAmount?.toLocaleString() }}
      </template>
      <template v-else-if="column.key === 'orderDate'">
        {{ formatDateTime(record.orderDate) }}
      </template>
      <template v-else-if="column.key === 'action'">
        <ActionCell :buttons="getActionButtons(record)" />
      </template>
    </template>
  </ListPageTemplate>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import ListPageTemplate from '@/components/ListPageTemplate.vue'
import ActionCell from '@/components/ActionCell.vue'
import { API_ENDPOINTS } from '@/constants/api'
import { useStatusMap, useDateFormat, useListData } from '@/composables'

const router = useRouter()

export interface PurchaseOrderRecord {
  id: number
  orderNo: string
  supplierName: string
  contactPerson?: string
  contactPhone?: string
  orderAmount?: number
  status: string
  orderDate?: string
  expectedDeliveryDate?: string
}

const pageTitle = '采购订单列表'

const filterItems = [
  { key: 'orderNo', label: '订单编号', type: 'input', placeholder: '请输入订单编号' },
  { key: 'supplierName', label: '供应商', type: 'input', placeholder: '请输入供应商名称' },
  { key: 'status', label: '状态', type: 'select', options: [
    { label: '全部', value: '' },
    { label: '草稿', value: 'draft' },
    { label: '审核中', value: 'pending' },
    { label: '已通过', value: 'approved' },
    { label: '已拒绝', value: 'rejected' },
    { label: '已关闭', value: 'closed' },
  ]},
  { key: 'dateRange', label: '下单日期', type: 'daterange', startPlaceholder: '开始日期', endPlaceholder: '结束日期' },
]

const columns = [
  { title: '订单编号', dataIndex: 'orderNo', key: 'orderNo', width: 150, fixed: 'left' },
  { title: '供应商', dataIndex: 'supplierName', key: 'supplierName', width: 180 },
  { title: '联系人', dataIndex: 'contactPerson', key: 'contactPerson', width: 100 },
  { title: '联系电话', dataIndex: 'contactPhone', key: 'contactPhone', width: 130 },
  { title: '订单金额', dataIndex: 'orderAmount', key: 'orderAmount', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '下单日期', dataIndex: 'orderDate', key: 'orderDate', width: 180 },
  { title: '预计交付日期', dataIndex: 'expectedDeliveryDate', key: 'expectedDeliveryDate', width: 180 },
  { title: '操作', key: 'action', width: 168, fixed: 'right' },
]

const statusMapConfig = {
  draft: { text: '草稿', color: 'default' },
  pending: { text: '审核中', color: 'status-pending' },
  approved: { text: '已通过', color: 'status-approved' },
  rejected: { text: '已拒绝', color: 'status-rejected' },
  closed: { text: '已关闭', color: 'default' },
}

const { registerStatusMap, getStatusText, getStatusColor } = useStatusMap({
  defaultStatusMap: statusMapConfig,
})
registerStatusMap(statusMapConfig)

const { formatDateTime } = useDateFormat()

const { loading, dataSource, filterParams, refresh, fetchData } = useListData({
  apiEndpoint: API_ENDPOINTS.PURCHASE_ORDERS,
  defaultPageSize: 100,
})

function getActionButtons(record: PurchaseOrderRecord | Record<string, unknown>) {
  const rec = record as PurchaseOrderRecord
  return [
    { key: 'detail', label: '详情', onClick: () => router.push(`/purchase-order/${rec.id}`) },
    { key: 'edit', label: '编辑', onClick: () => router.push(`/purchase-order/${rec.id}/edit`) },
    { key: 'submit', label: '提交', onClick: () => handleSubmit(rec) },
    { key: 'delete', label: '删除', danger: true, confirm: true, confirmTitle: '确定删除？', onClick: () => handleDelete(rec) },
  ]
}

async function handleSubmit(record: PurchaseOrderRecord) {
  try {
    const res = await fetch(`${API_ENDPOINTS.PURCHASE_ORDERS}/${record.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const json = await res.json()
    if (json.code === 200) {
      message.success('提交成功')
      refresh()
    } else {
      message.error(json.message || '提交失败，请稍后重试')
    }
  } catch (e) {
    console.error('提交失败', e)
    message.error('提交失败，请稍后重试')
  }
}

async function handleDelete(record: PurchaseOrderRecord) {
  try {
    const res = await fetch(`${API_ENDPOINTS.PURCHASE_ORDERS}/${record.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
    const json = await res.json()
    if (json.code === 200) {
      message.success('删除成功')
      refresh()
    } else {
      message.error(json.message || '删除失败，请稍后重试')
    }
  } catch (e) {
    console.error('删除失败', e)
    message.error('删除失败，请稍后重试')
  }
}

function handleSearch() {
  fetchData()
}

function handleReset() {
  filterParams.value = {}
  fetchData()
}

function handleAdd() {
  router.push('/purchase-order/create')
}

function handleBatchExport() {
  message.info('批量导出功能开发中')
}

function handleBatchImport() {
  message.info('批量导入功能开发中')
}

function handleSettings() {
  message.info('设置功能开发中')
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.danger {
  color: var(--color-error);
}

.icon-only-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  &:focus {
    outline: none !important;
    box-shadow: none !important;
  }

  &:active {
    outline: none !important;
    box-shadow: none !important;
  }
}

.icon-only-btn :deep(.anticon) {
  margin: 0;
}

.icon-only-btn :deep(svg) {
  width: 16px !important;
  height: 16px !important;
}
</style>
