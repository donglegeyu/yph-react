<template>
  <SmartListTemplate
    v-model:filter-model-value="filterParams"
    :fields="fields"
    :data-source="dataSource"
    :loading="loading"
    :title="pageTitle"
    :pagination="pagination"
    view-endpoint="/api/views"
    view-type="domain-management"
    @search="handleSearch"
    @reset="handleReset"
  >
    <template #toolbar-actions>
      <a-space :size="12">
        <a-button type="primary" @click="handleAdd">
          新增域
        </a-button>
        <ColumnSettingsPanel
          :fields="columnFields"
          :default-fields="defaultColumnFields"
          :exclude-keys="[]"
          @confirm="handleColumnSettingsConfirm"
          @reset="handleColumnSettingsReset"
        />
        <a-button class="icon-only-btn" @click="refresh" style="width: 32px; height: 32px; padding: 0;">
          <svg viewBox="0 0 48 48" style="width:16px;height:16px"><use href="#refresh" /></svg>
        </a-button>
      </a-space>
    </template>
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'isDefault'">
        {{ record.isDefault === 1 ? '默认域' : '自定义域' }}
      </template>
      <template v-else-if="column.key === 'menuCount'">
        {{ record.menuCount || 0 }}个
      </template>
      <template v-else-if="column.key === 'userCount'">
        {{ record.userCount || 0 }}人
      </template>
      <template v-else-if="column.key === 'status'">
        <a-tag :color="record.status === 1 ? 'success' : 'default'">
          {{ record.status === 1 ? '启用' : '禁用' }}
        </a-tag>
      </template>
      <template v-else-if="column.key === 'action'">
        <ActionCell :buttons="getActionButtons(record)" />
      </template>
    </template>
  </SmartListTemplate>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import SmartListTemplate from '@/components/SmartListTemplate.vue'
import ActionCell from '@/components/ActionCell.vue'
import ColumnSettingsPanel from '@/components/ColumnSettingsPanel.vue'
import { useDomains } from '@/composables'

const router = useRouter()

const {
  loading,
  dataSource,
  pagination,
  filterParams,
  fetchData,
  refresh,
  updateDomainStatus,
  deleteDomain,
} = useDomains()

const fields = [
  { key: 'domainKey', label: '域标识', type: 'input' as const, width: 150 },
  { key: 'domainName', label: '域名称', type: 'input' as const, width: 150 },
  { key: 'isDefault', label: '域类型', type: 'input' as const, width: 100 },
  { key: 'menuCount', label: '包含菜单数', type: 'input' as const, width: 100 },
  { key: 'userCount', label: '用户数', type: 'input' as const, width: 80 },
  { key: 'status', label: '状态', type: 'select' as const, options: [
    { label: '全部', value: '' },
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 }
  ], width: 100 },
  { key: 'action', label: '操作', width: 150 }
]

interface ColumnField {
  key: string
  label: string
  visible: boolean
  width?: number
  fixed?: 'left' | 'right' | undefined
}

const defaultColumnFields: ColumnField[] = fields
  .filter(field => field.key !== 'action')
  .map(field => ({
    key: field.key,
    label: field.label,
    visible: true,
    width: field.width,
  }))

const columnFields = ref<ColumnField[]>([])

function initColumnFields() {
  columnFields.value = JSON.parse(JSON.stringify(defaultColumnFields))
}

function loadColumnSettings() {
  try {
    const saved = localStorage.getItem('domain-management-column-settings')
    if (saved) {
      const savedFields = JSON.parse(saved)
      if (Array.isArray(savedFields) && savedFields.length > 0) {
        columnFields.value = savedFields
        return
      }
    }
  } catch (e) {
    console.error('加载列设置失败', e)
  }
  initColumnFields()
}

function saveColumnSettings() {
  try {
    localStorage.setItem('domain-management-column-settings', JSON.stringify(columnFields.value))
  } catch (e) {
    console.error('保存列设置失败', e)
  }
}

function handleColumnSettingsConfirm(fields: ColumnField[]) {
  columnFields.value = fields
  saveColumnSettings()
}

function handleColumnSettingsReset() {
  columnFields.value = JSON.parse(JSON.stringify(defaultColumnFields))
  saveColumnSettings()
}

const pageTitle = '域管理'

function handleSearch() {
  fetchData(filterParams.value)
}

function handleReset() {
  Object.assign(filterParams.value, { domainName: '', status: '' })
  pagination.value.current = 1
  fetchData(filterParams.value)
}

function handleAdd() {
  router.push('/domain-manage/create')
}

function handleEdit(record: any) {
  router.push(`/domain-manage/${record.id}`)
}

function getActionButtons(record: any) {
  const buttons = [
    { key: 'edit', label: '编辑', onClick: () => handleEdit(record) },
    { key: 'toggle', label: record.status === 1 ? '禁用' : '启用', onClick: () => handleToggleStatus(record) }
  ]
  if (record.isDefault !== 1) {
    buttons.push({ key: 'delete', label: '删除', onClick: () => handleDelete(record) })
  }
  return buttons
}

async function handleToggleStatus(record: any) {
  const success = await updateDomainStatus(record.id, record.status === 1 ? 0 : 1)
  if (success) {
    refresh()
  }
}

async function handleDelete(record: any) {
  const success = await deleteDomain(record.id)
  if (success) {
    refresh()
  }
}

onMounted(() => {
  fetchData()
  loadColumnSettings()
})
</script>
