<template>
  <SmartListTemplate
    :title="pageTitle"
    :fields="fields"
    :data-source="dataSource"
    :loading="loading"
    :pagination="paginationConfig"
    :view-endpoint="'/api/construction-views'"
    view-type="construction-application"
    @search="handleSearch"
    @change="handleTableChange"
  >
    <template #toolbar-actions>
      <a-space :size="12">
        <a-button type="primary" @click="handleAdd">
          新增
        </a-button>
        <a-dropdown :trigger="['click']">
          <a-button class="export-dropdown-btn" style="display: inline-flex; align-items: center; padding-right: 8px;">
            导出
            <svg viewBox="0 0 48 48" style="width:16px;height:16px;margin-left:4px" class="dropdown-arrow">
              <use href="#down" />
            </svg>
          </a-button>
          <template #overlay>
            <a-menu @click="(e: any) => handleExportMenuClick(e)">
              <a-menu-item key="export-all">导出全部</a-menu-item>
              <a-menu-item key="export-selected">导出选中</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
        <a-button @click="handleBatchImport">导入</a-button>
        <ColumnSettingsPanel
          :fields="columnFields"
          :default-fields="defaultColumnFields"
          :exclude-keys="['action']"
          @confirm="handleColumnSettingsConfirm"
          @reset="handleColumnSettingsReset"
        >
          <a-button class="icon-only-btn" style="width: 32px; height: 32px; padding-left: 0px; padding-right: 0px;">
            <template #icon><svg viewBox="0 0 48 48" style="width:16px;height:16px"><use href="#setting" /></svg></template>
          </a-button>
        </ColumnSettingsPanel>
        <a-button @click="fetchData" class="icon-only-btn" style="width: 32px; height: 32px;">
          <template #icon><svg viewBox="0 0 48 48" style="width:16px;height:16px"><use href="#refresh" /></svg></template>
        </a-button>
      </a-space>
    </template>
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'status'">
        <a-tag :class="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
      </template>
      <template v-else-if="column.key === 'applyTime'">
        {{ formatDateTime(record.applyTime) }}
      </template>
      <template v-else-if="column.key === 'createTime'">
        {{ formatDateTime(record.createTime) }}
      </template>
      <template v-else-if="column.key === 'action'">
        <ActionCell :buttons="getActionButtons(record)" />
      </template>
    </template>
  </SmartListTemplate>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import SmartListTemplate from '@/components/SmartListTemplate.vue'
import ActionCell from '@/components/ActionCell.vue'
import ColumnSettingsPanel from '@/components/ColumnSettingsPanel.vue'
import { API_ENDPOINTS } from '@/constants/api'
import { useStatusMap, useDateFormat, useListData } from '@/composables'

const pageTitle = '施工申请列表'

const { registerStatusMap, getStatusText, getStatusColor } = useStatusMap()
registerStatusMap({
  draft: { text: '草稿', color: 'default' },
  pending: { text: '审核中', color: 'status-pending' },
  approved: { text: '已通过', color: 'status-approved' },
  rejected: { text: '已拒绝', color: 'status-rejected' },
})

const { formatDateTime } = useDateFormat()

interface FieldDefinition {
  key: string
  label: string
  type?: 'input' | 'select' | 'date' | 'daterange'
  placeholder?: string
  options?: Array<{ label: string; value: string }>
  width?: number
  fixed?: 'left' | 'right'
}

interface ColumnField {
  key: string
  label: string
  visible: boolean
  width?: number
  fixed?: 'left' | 'right'
}

const defaultColumnFields = ref<ColumnField[]>([
  { key: 'applicationNo', label: '申请单号', visible: true, width: 150, fixed: 'left' },
  { key: 'constructionName', label: '施工项名称', visible: true, width: 180 },
  { key: 'content', label: '施工内容', visible: true, width: 200 },
  { key: 'status', label: '状态', visible: true, width: 100 },
  { key: 'quantity', label: '申请数量', visible: true, width: 100 },
  { key: 'budget', label: '预算', visible: true, width: 120 },
  { key: 'applicant', label: '申请人', visible: true, width: 100 },
  { key: 'applyTime', label: '申请日期', visible: true, width: 180 },
  { key: 'action', label: '操作', visible: true, width: 148, fixed: 'right' },
])

const { loading, dataSource } = useListData({
  apiEndpoint: API_ENDPOINTS.CONSTRUCTION_APPLICATIONS,
  defaultPageSize: 20,
})

const columnFields = ref<ColumnField[]>([])

const paginationConfig = ref({
  current: 1,
  pageSize: 20,
  total: 0,
})

const fields = computed<FieldDefinition[]>(() => {
  const sourceFields = columnFields.value.length > 0 ? columnFields.value : defaultColumnFields.value
  
  return sourceFields.map(field => {
    const baseField: FieldDefinition = {
      key: field.key,
      label: field.label,
      width: field.width,
      fixed: field.fixed as 'left' | 'right' | undefined,
    }
    
    if (field.key === 'status') {
      return {
        ...baseField,
        type: 'select' as const,
        placeholder: '请选择',
        options: [
          { label: '全部', value: '' },
          { label: '草稿', value: 'draft' },
          { label: '审核中', value: 'pending' },
          { label: '已通过', value: 'approved' },
          { label: '已拒绝', value: 'rejected' },
        ],
      }
    } else if (field.key === 'applyTime') {
      return {
        ...baseField,
        type: 'date' as const,
        placeholder: '请选择日期',
      }
    } else {
      return {
        ...baseField,
        type: 'input' as const,
        placeholder: '请输入',
      }
    }
  })
})

function getActionButtons(record: any) {
  return [
    { key: 'view', label: '查看', onClick: () => handleView(record) },
    { key: 'edit', label: '编辑', onClick: () => handleEdit(record) },
    { key: 'delete', label: '删除', onClick: () => handleDelete(record) },
  ]
}

function getMockData() {
  return [
    {
      id: 1,
      applicationNo: 'CA202604220001',
      constructionName: '基础开挖工程',
      content: 'A栋楼地基土方开挖',
      status: 'approved',
      quantity: 1,
      budget: 50000,
      applicant: '张三',
      applyTime: '2026-04-22 08:30:00',
    },
    {
      id: 2,
      applicationNo: 'CA202604220002',
      constructionName: '钢筋绑扎工程',
      content: '地下室钢筋绑扎施工',
      status: 'pending',
      quantity: 1,
      budget: 80000,
      applicant: '李四',
      applyTime: '2026-04-22 09:00:00',
    },
    {
      id: 3,
      applicationNo: 'CA202604220003',
      constructionName: '混凝土浇筑',
      content: '一层楼板混凝土浇筑',
      status: 'draft',
      quantity: 1,
      budget: 120000,
      applicant: '王五',
      applyTime: '2026-04-22 10:00:00',
    },
    {
      id: 4,
      applicationNo: 'CA202604220004',
      constructionName: '防水施工',
      content: '屋面防水卷材铺设',
      status: 'approved',
      quantity: 1,
      budget: 35000,
      applicant: '赵六',
      applyTime: '2026-04-22 11:00:00',
    },
    {
      id: 5,
      applicationNo: 'CA202604220005',
      constructionName: '外墙保温',
      content: '外墙外保温系统安装',
      status: 'rejected',
      quantity: 1,
      budget: 65000,
      applicant: '张三',
      applyTime: '2026-04-22 14:00:00',
    },
  ]
}

async function fetchData(params: any = {}) {
  loading.value = true
  try {
    const queryParams = new URLSearchParams({
      current: paginationConfig.value.current.toString(),
      pageSize: paginationConfig.value.pageSize.toString(),
      ...params
    })
    
    const res = await fetch(`${API_ENDPOINTS.CONSTRUCTION_APPLICATIONS}?${queryParams}`)
    const json = await res.json()
    if (json.code === 200) {
      dataSource.value = json.data?.records || json.data || []
      paginationConfig.value.total = json.total || 0
    } else {
      message.error('施工申请列表加载失败，请稍后重试')
      dataSource.value = []
      paginationConfig.value.total = 0
    }
  } catch (e) {
    console.error('fetch data failed:', e)
    message.error('施工申请列表加载失败，将显示缓存数据')
    dataSource.value = getMockData()
    paginationConfig.value.total = dataSource.value.length
  } finally {
    loading.value = false
  }
}

function handleSearch(params: any) {
  paginationConfig.value.current = 1
  fetchData(params)
}

function handleTableChange(pagination: any) {
  paginationConfig.value.current = pagination.current
  paginationConfig.value.pageSize = pagination.pageSize
  fetchData()
}

function handleAdd() {
  message.info('新增施工申请功能开发中')
}

function handleView(record: any) {
  message.info(`查看申请单: ${record.applicationNo}`)
}

function handleEdit(record: any) {
  message.info(`编辑申请单: ${record.applicationNo}`)
}

function handleDelete(record: any) {
  message.info(`删除申请单: ${record.applicationNo}`)
}

function handleExportMenuClick({ key }: { key: string }) {
  if (key === 'export-all') {
    message.info('导出全部功能开发中')
  } else if (key === 'export-selected') {
    message.info('导出选中功能开发中')
  }
}

function handleBatchImport() {
  message.info('导入功能开发中')
}

function handleColumnSettingsConfirm(fields: ColumnField[]) {
  columnFields.value = fields
  message.success('列设置已保存')
}

function handleColumnSettingsReset() {
  columnFields.value = [...defaultColumnFields.value]
  message.success('列设置已重置')
}

onMounted(() => {
  fetchData()
  columnFields.value = [...defaultColumnFields.value]
})
</script>

<style scoped>
.icon-only-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.icon-only-btn:focus {
  outline: none !important;
  box-shadow: none !important;
}

.icon-only-btn :deep(.anticon) {
  margin: 0;
}

.icon-only-btn :deep(svg) {
  width: 16px !important;
  height: 16px !important;
}

:deep(.dropdown-text-btn) {
  display: inline-flex !important;
  align-items: center !important;
  color: rgba(0, 0, 0, 0.88) !important;
  font-weight: normal !important;
  background: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

:deep(.export-dropdown-btn) {
  display: inline-flex;
  align-items: center;
  padding-right: 8px;
}

:deep(.dropdown-arrow) {
  margin-left: 4px;
}

:deep(.modified-tag-inline) {
  display: inline-block;
  padding: 0 4px;
  margin-left: 4px;
  font-size: 10px;
  color: #F95914;
  background: rgba(249, 89, 20, 0.1);
  border-radius: 2px;
  line-height: 16px;
}

:deep(.save-filter-btn) {
  color: #F95914;
  border-color: #F95914;
}
</style>
