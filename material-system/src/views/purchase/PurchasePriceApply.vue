<template>
  <SmartListTemplate
    v-model:filter-model-value="filterParams"
    :fields="fields"
    :data-source="dataSource"
    :loading="loading"
    :title="pageTitle"
    view-endpoint="/api/purchase-price-views"
    view-type="purchase-price"
    @search="fetchData"
    @reset="handleReset"
  >
    <template #toolbar-actions>
      <a-space :size="12">
        <a-button type="primary" @click="handleAdd">
          新增价格申请
        </a-button>
        <a-button class="icon-only-btn" @click="fetchData" style="width: 32px; height: 32px;">
          <template #icon><svg viewBox="0 0 48 48" style="width:16px;height:16px"><use href="#refresh" /></svg></template>
        </a-button>
      </a-space>
    </template>
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'status'">
        <a-tag :color="getStatusColor(record.status)">
          {{ getStatusText(record.status) }}
        </a-tag>
      </template>
      <template v-else-if="column.key === 'action'">
        <ActionCell :buttons="getActionButtons(record)" />
      </template>
      <template v-else-if="column.key === 'applyTime'">
        {{ formatDate(record.applyTime) }}
      </template>
      <template v-else-if="column.key === 'approveTime'">
        {{ record.approveTime ? formatDate(record.approveTime) : '-' }}
      </template>
    </template>
  </SmartListTemplate>

  <!-- 新增/编辑抽屉 -->
  <a-drawer
    v-model:open="modalVisible"
    :title="modalTitle"
    width="480"
    @close="handleModalCancel"
  >
    <a-form :model="formData" layout="vertical" ref="formRef">
      <a-form-item label="申请单号" name="applyNo">
        <a-input v-model:value="formData.applyNo" placeholder="自动生成" :disabled="!!formData.id" />
      </a-form-item>
      <a-form-item label="物料编码" name="materialCode">
        <a-input v-model:value="formData.materialCode" placeholder="请输入物料编码" />
      </a-form-item>
      <a-form-item label="物料名称" name="materialName">
        <a-input v-model:value="formData.materialName" placeholder="请输入物料名称" />
      </a-form-item>
      <a-form-item label="申请价格" name="applyPrice">
        <a-input v-model:value="formData.applyPrice" placeholder="请输入申请价格" type="number" />
      </a-form-item>
      <a-form-item label="申请原因" name="applyReason">
        <a-textarea v-model:value="formData.applyReason" placeholder="请输入申请原因" :rows="3" />
      </a-form-item>
      <a-form-item label="申请人" name="applicant">
        <a-input v-model:value="formData.applicant" placeholder="请输入申请人" />
      </a-form-item>
    </a-form>
    <template #footer>
      <a-space>
        <a-button @click="handleModalCancel">取消</a-button>
        <a-button type="primary" @click="handleModalOk">确定</a-button>
      </a-space>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import SmartListTemplate from '@/components/SmartListTemplate.vue'
import ActionCell from '@/components/ActionCell.vue'

interface PurchasePriceApply {
  id: number
  applyNo: string
  materialCode: string
  materialName: string
  applyPrice: number
  applyReason: string
  applicant: string
  applyTime: string
  status: number
  approveTime?: string
  approver?: string
}

interface PurchasePriceApplyForm {
  id: number | null
  applyNo: string
  materialCode: string
  materialName: string
  applyPrice: number
  applyReason: string
  applicant: string
}

interface PurchasePriceFilterParams {
  applyNo?: string
  materialCode?: string
  materialName?: string
  status?: number | string
  applicant?: string
  applyTime?: [string, string]
  [key: string]: string | number | [string, string] | undefined
}

const loading = ref(false)
const dataSource = ref<PurchasePriceApply[]>([])
const filterParams = ref<PurchasePriceFilterParams>({})

const pageTitle = '价格申请单'

const fields = [
  { key: 'applyNo', label: '申请单号', type: 'input' as const, width: 150 },
  { key: 'materialCode', label: '物料编码', type: 'input' as const, width: 150 },
  { key: 'materialName', label: '物料名称', type: 'input' as const, width: 200 },
  { key: 'applyPrice', label: '申请价格', type: 'input' as const, width: 120 },
  { key: 'applicant', label: '申请人', type: 'input' as const, width: 120 },
  { key: 'applyTime', label: '申请时间', type: 'daterange' as const, width: 180 },
  { key: 'status', label: '状态', type: 'select' as const, options: [
    { label: '待审核', value: 0 },
    { label: '已通过', value: 1 },
    { label: '已拒绝', value: 2 },
  ], width: 100 },
  { key: 'approveTime', label: '审核时间', type: 'input' as const, width: 180 },
  { key: 'action', label: '操作', width: 148 },
]

const statusMap: Record<number, string> = {
  0: '待审核',
  1: '已通过',
  2: '已拒绝',
}

const statusColorMap: Record<number, string> = {
  0: 'orange',
  1: 'success',
  2: 'error',
}

function getStatusText(status: number): string {
  return statusMap[status] || '未知'
}

function getStatusColor(status: number): string {
  return statusColorMap[status] || 'default'
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const modalVisible = ref(false)
const modalTitle = ref('')
const formData = ref<PurchasePriceApplyForm>({
  id: null,
  applyNo: '',
  materialCode: '',
  materialName: '',
  applyPrice: 0,
  applyReason: '',
  applicant: '',
})

async function fetchData() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    Object.entries(filterParams.value).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          params.append(`${key}[0]`, value[0])
          params.append(`${key}[1]`, value[1])
        } else {
          params.append(key, String(value))
        }
      }
    })

    const res = await fetch(`/api/purchase-price-apply?${params.toString()}`)
    const json = await res.json()
    if (json.code === 200) {
      dataSource.value = json.data || []
    } else {
      message.error('价格申请数据加载失败，请稍后重试')
    }
  } catch (e) {
    console.error('fetch purchase-price-apply failed:', e)
    message.error('价格申请数据加载失败，请稍后重试')
  }
  loading.value = false
}

function handleReset() {
  filterParams.value = {}
  fetchData()
}

function handleAdd() {
  modalTitle.value = '新增价格申请'
  formData.value = {
    id: null,
    applyNo: '',
    materialCode: '',
    materialName: '',
    applyPrice: 0,
    applyReason: '',
    applicant: '',
  }
  modalVisible.value = true
}

function getActionButtons(record: PurchasePriceApply | Record<string, any>) {
  const buttons = []
  const applyRecord = record as PurchasePriceApply

  buttons.push({ key: 'view', label: '查看', onClick: () => handleView(applyRecord) })

  if (applyRecord.status === 0) {
    buttons.push({ key: 'edit', label: '编辑', onClick: () => handleEdit(applyRecord) })
    buttons.push({ key: 'submit', label: '提交', onClick: () => handleSubmit(applyRecord) })
    buttons.push({ 
      key: 'delete', 
      label: '删除', 
      danger: true, 
      confirm: true, 
      confirmTitle: '确定删除？', 
      onClick: () => handleDelete(applyRecord) 
    })
  }

  return buttons
}

function handleView(record: PurchasePriceApply) {
  modalTitle.value = '查看价格申请'
  formData.value = {
    id: record.id,
    applyNo: record.applyNo,
    materialCode: record.materialCode,
    materialName: record.materialName,
    applyPrice: record.applyPrice,
    applyReason: record.applyReason,
    applicant: record.applicant,
  }
  modalVisible.value = true
}

function handleEdit(record: PurchasePriceApply) {
  modalTitle.value = '编辑价格申请'
  formData.value = {
    id: record.id,
    applyNo: record.applyNo,
    materialCode: record.materialCode,
    materialName: record.materialName,
    applyPrice: record.applyPrice,
    applyReason: record.applyReason,
    applicant: record.applicant,
  }
  modalVisible.value = true
}

async function handleSubmit(record: PurchasePriceApply) {
  try {
    const res = await fetch(`/api/purchase-price-apply/${record.id}/submit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    })
    const json = await res.json()
    if (json.code === 200) {
      message.success('提交成功')
      fetchData()
    } else {
      message.error(json.message || '提交失败')
    }
  } catch (e) {
    message.error('提交失败')
  }
}

async function handleDelete(record: PurchasePriceApply) {
  if (!record.id) return
  try {
    const res = await fetch(`/api/purchase-price-apply/${record.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.code === 200) {
      message.success('删除成功')
      fetchData()
    } else {
      message.error(json.message || '删除失败')
    }
  } catch (e) {
    message.error('删除失败')
  }
}

async function handleModalOk() {
  try {
    const method = formData.value.id ? 'PUT' : 'POST'
    const url = formData.value.id 
      ? `/api/purchase-price-apply/${formData.value.id}` 
      : '/api/purchase-price-apply'
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData.value),
    })
    const json = await res.json()
    if (json.code === 200) {
      message.success(formData.value.id ? '更新成功' : '新增成功')
      modalVisible.value = false
      fetchData()
    } else {
      message.error(json.message || '操作失败')
    }
  } catch (e) {
    message.error('操作失败')
  }
}

function handleModalCancel() {
  modalVisible.value = false
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
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