<template>
  <ListPageTemplate
    v-model:filter-model-value="filterParams"
    :pagination="paginationConfig"
    :filter-items="(filteredFilterItems as any)"
    :columns="(columns as any)"
    :data-source="dataSource"
    :loading="loading"
    :title="pageTitle"
    @search="handleSearch"
    @reset="handleReset"
    @add="handleAdd"
    @change="handleFilterParamsChange"
  >
    <template #title-actions>
      <div class="page-header-line"></div>
      <a-dropdown 
        :trigger="['click']"
        v-model:open="dropdownOpen"
      >
        <a-button 
          size="small" 
          type="text"
          class="dropdown-text-btn"
          style="color: rgba(0, 0, 0, 0.88); background: transparent; border-color: transparent; box-shadow: none; outline: none;"
        >
          {{ getDropdownButtonText() }}
          <span v-if="hasModified && hasSearched" class="modified-tag-inline">已修改</span>
          <svg viewBox="0 0 48 48" style="width:16px;height:16px;margin-left:4px">
            <use :href="dropdownOpen ? '#up' : '#down'" />
          </svg>
        </a-button>
        <template #overlay>
          <a-menu @click="(e: any) => handleMenuClick(e)">
            <a-menu-item key="default">
              <div class="scheme-option">
                <span @click="handleSchemeChange('default')">默认视图</span>
                <span style="font-size: 12px; color: rgba(0, 0, 0, 0.45);">（全量）</span>
              </div>
            </a-menu-item>
            <a-menu-item 
              v-for="scheme in filterSchemes" 
              :key="scheme.id"
            >
              <div class="scheme-option">
                <span @click="handleSchemeChange(scheme.id)">{{ scheme.name }}</span>
                <span style="margin-left: 0px; font-size: 12px; color: rgba(0, 0, 0, 0.45);">（{{ scheme.filterOrder?.length || 0 }}）</span>
                <span class="action-icons">
                  <svg 
                    class="action-icon edit-icon"
                    viewBox="0 0 48 48"
                    @click.stop="handleEditScheme(scheme.id)"
                  >
                    <use href="#writing-fluently" />
                  </svg>
                  <span 
                    class="action-icon delete-icon"
                    @click.stop="handleDeleteScheme(scheme.id)"
                  >✕</span>
                </span>
              </div>
            </a-menu-item>
            <a-menu-divider />
            <a-menu-item key="add-view" @click="handleSaveAs">
              <span style="color: #F95914">+ 新增视图</span>
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
      <a-button v-if="hasModified && hasSearched" size="small" class="save-filter-btn" @click="handleSave">
        保存
      </a-button>
      <a-button v-if="hasModified && hasSearched" size="small" class="save-filter-btn" @click="handleSaveAs">
        另存为
      </a-button>
    </template>
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
      <template v-else-if="column.key === 'materialQuantity'">
        {{ record.materialQuantity ?? '-' }}
      </template>
      <template v-else-if="column.key === 'action'">
        <ActionCell :buttons="getActionButtons(record)" />
      </template>
    </template>
  </ListPageTemplate>
  
  <a-drawer
    v-model:open="saveSchemeDialogVisible"
    :title="isEditMode ? '编辑视图' : '新增视图'"
    :width="380"
    :footer-style="{ textAlign: 'right' }"
    @close="handleDrawerClose"
  >
    <div class="drawer-content">
      <div class="form-item">
        <div class="form-label">
          视图名称
          <span class="required-star">*</span>
        </div>
        <div class="input-with-count">
          <a-input
            v-model:value="newSchemeName"
            placeholder="请输入8个字以内的视图名称"
            :maxlength="8"
          />
          <span class="word-count">{{ newSchemeName.length }}/8</span>
        </div>
      </div>
      
      <div class="form-item" style="margin-top: 32px;">
          <div class="form-label">
            视图条件
            <span class="required-star">*</span>
          </div>
          <div class="filter-list-hint">勾选并调整视图条件顺序后保存</div>
        
        <div class="filter-list-container">
          <div
            v-for="(item, index) in dialogFilterOptions"
            :key="item.key"
            class="filter-item"
            draggable="true"
            @dragstart="handleDragStart($event, index)"
            @dragover.prevent="handleDragOver($event, index)"
            @drop="handleDrop($event, index)"
            @dragend="handleDragEnd"
          >
            <div class="filter-row">
              <svg class="drag-icon" viewBox="0 0 48 48">
                <use href="#drag" />
              </svg>
              <a-checkbox 
                :checked="item.checked" 
                @change="(e) => handleDialogFilterChange(e, index)"
              >
                {{ item.label }}
              </a-checkbox>
            </div>
            <div class="default-value-row" v-if="item.checked">
              <a-select
                v-if="item.options"
                :value="item.defaultValue || ''"
                @change="(val) => handleDefaultValueChange(index, val)"
                :options="item.options"
                placeholder="默认值"
                style="width: 100%;"
                allow-clear
              />
              <a-input
                v-else-if="item.key === 'dateRange'"
                :value="item.defaultValue || ''"
                @input="(e) => handleDefaultValueChange(index, e.target.value)"
                placeholder="默认日期"
                style="width: 100%;"
              />
              <a-input
                v-else
                :value="item.defaultValue || ''"
                @input="(e) => handleDefaultValueChange(index, e.target.value)"
                placeholder="默认值"
                style="width: 100%;"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <a-space :size="12">
        <a-button @click="handleDrawerClose">取消</a-button>
        <a-button type="primary" @click="confirmSaveScheme">保存</a-button>
      </a-space>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import ListPageTemplate from '@/components/ListPageTemplate.vue'
import ActionCell from '@/components/ActionCell.vue'
import ColumnSettingsPanel from '@/components/ColumnSettingsPanel.vue'
import { API_ENDPOINTS } from '@/constants/api'
import { useStatusMap, useDateFormat, useListData } from '@/composables'

if (!localStorage.getItem('userInfo')) {
  localStorage.setItem('userInfo', JSON.stringify({
    id: 'user-001',
    name: '张三',
    username: 'zhangsan'
  }))
}

const router = useRouter()
const pageTitle = '材料申请列表'

const { registerStatusMap, getStatusText, getStatusColor } = useStatusMap()
registerStatusMap({
  draft: { text: '草稿', color: 'default' },
  pending: { text: '审核中', color: 'status-pending' },
  approved: { text: '已通过', color: 'status-approved' },
  rejected: { text: '已拒绝', color: 'status-rejected' },
})

const { formatDateTime, formatDate } = useDateFormat()

interface ColumnField {
  key: string
  label: string
  visible: boolean
  width?: number
  fixed?: 'left' | 'right'
}

const defaultColumnFields = ref<ColumnField[]>([
  { key: 'materialName', label: '材料名称', visible: true, width: 180, fixed: 'left' },
  { key: 'applicationNo', label: '申请单号', visible: true, width: 150 },
  { key: 'status', label: '状态', visible: true, width: 100 },
  { key: 'spec', label: '规格型号', visible: true, width: 120 },
  { key: 'unit', label: '单位', visible: true, width: 80 },
  { key: 'quantity', label: '申请数量', visible: true, width: 100 },
  { key: 'materialQuantity', label: '材料数量', visible: true, width: 100 },
  { key: 'applicant', label: '申请人', visible: true, width: 100 },
  { key: 'department', label: '部门', visible: true, width: 100 },
  { key: 'applyTime', label: '申请日期', visible: true, width: 220 },
  { key: 'action', label: '操作', visible: false, width: 148, fixed: 'right' },
])

const { loading, dataSource, filterParams } = useListData({
  apiEndpoint: API_ENDPOINTS.MATERIALS,
  defaultPageSize: 100,
})

const paginationConfig = ref({
  current: 1,
  pageSize: 20,
  total: 0
})

const columnFields = ref<ColumnField[]>([])
const saveSchemeDialogVisible = ref(false)
const newSchemeName = ref('')
const dropdownOpen = ref(false)
const dragIndex = ref<number | null>(null)
const isEditMode = ref(false)
const editingSchemeId = ref<string | null>(null)
const hasModified = ref(false)
const originalDefaultValues = ref<Record<string, any>>({})
const viewInitialized = ref(false)
const initializedFilterParams = ref<Record<string, any>>({})
const isRecordingBaseline = ref(false)
const hasSearched = ref(false)

interface FilterOption {
  key: string
  label: string
  checked: boolean
  defaultValue?: any
  options?: Array<{ label: string; value: string }>
}

const filterOptions = ref<FilterOption[]>([
  { key: 'applicationNo', label: '申请单号', checked: true },
  { key: 'materialName', label: '材料名称', checked: true },
  { key: 'spec', label: '规格型号', checked: true },
  { key: 'unit', label: '单位', checked: true },
  { key: 'quantity', label: '申请数量', checked: true },
  { key: 'materialQuantity', label: '材料数量', checked: true },
  { key: 'applicant', label: '申请人', checked: true },
  { key: 'status', label: '状态', checked: true },
  { key: 'department', label: '部门', checked: true },
  { key: 'dateRange', label: '申请日期', checked: true },
])

const dialogFilterOptions = ref<FilterOption[]>([
  { key: 'applicationNo', label: '申请单号', checked: false },
  { key: 'materialName', label: '材料名称', checked: false },
  { key: 'spec', label: '规格型号', checked: false },
  { key: 'unit', label: '单位', checked: false },
  { key: 'quantity', label: '申请数量', checked: false },
  { key: 'materialQuantity', label: '材料数量', checked: false },
  { key: 'applicant', label: '申请人', checked: false },
  { key: 'status', label: '状态', checked: false, options: [
    { label: '全部', value: '' },
    { label: '草稿', value: 'draft' },
    { label: '审核中', value: 'pending' },
    { label: '已通过', value: 'approved' },
    { label: '已拒绝', value: 'rejected' },
  ]},
  { key: 'department', label: '部门', checked: false, options: [
    { label: '全部', value: '' },
    { label: '工程部', value: 'engineering' },
    { label: '采购部', value: 'procurement' },
    { label: '财务部', value: 'finance' },
  ]},
  { key: 'dateRange', label: '申请日期', checked: false },
])

interface FilterScheme {
  id: string
  name: string
  filters: Record<string, any>
  createdAt: string
  userId: string
  filterOrder: string[]
}

const filterSchemes = ref<FilterScheme[]>([])
const currentScheme = ref<string>('')

function getCurrentUserId(): string {
  const userInfo = localStorage.getItem('userInfo')
  if (userInfo) {
    try {
      const user = JSON.parse(userInfo)
      return user.id || user.userId || 'default'
    } catch (e) {
      console.error('解析用户信息失败', e)
    }
  }
  return 'default'
}

async function loadSchemes() {
  try {
    const res = await fetch(API_ENDPOINTS.MATERIAL_VIEWS, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (res.ok) {
      const json = await res.json()
      if (json.code === 200) {
        filterSchemes.value = json.data || []
      } else {
        filterSchemes.value = []
      }
    } else {
      filterSchemes.value = []
    }
  } catch (e) {
    console.error('加载视图失败', e)
    filterSchemes.value = []
  }
  
  await loadLastUsedScheme()
}

async function saveLastUsedScheme(schemeId: string) {
  try {
    await fetch(API_ENDPOINTS.USER_PREFERENCES, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'material-last-used-scheme',
        value: schemeId,
      }),
    })
  } catch (e) {
    console.warn('保存当前视图失败', e)
  }
}

async function loadLastUsedScheme() {
  try {
    const res = await fetch(`${API_ENDPOINTS.USER_PREFERENCES}?key=material-last-used-scheme`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    
    if (res.ok) {
      const json = await res.json()
      if (json.code === 200 && json.data) {
        const lastUsedSchemeId = json.data as string
        const scheme = filterSchemes.value.find(s => s.id === lastUsedSchemeId)
        if (scheme) {
          applyScheme(scheme)
        }
      }
    }
  } catch (e) {
    console.warn('加载上次视图失败', e)
  }
}

function applyScheme(scheme: FilterScheme) {
  viewInitialized.value = true
  isRecordingBaseline.value = true
  initializedFilterParams.value = {}
  hasSearched.value = false
  
  Object.keys(filterParams.value).forEach(key => {
    delete filterParams.value[key]
  })
  
  if (scheme.filterOrder) {
    const orderedOptions = [...filterOptions.value].sort((a, b) => {
      const indexA = scheme.filterOrder.indexOf(a.key)
      const indexB = scheme.filterOrder.indexOf(b.key)
      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })
    filterOptions.value.splice(0, filterOptions.value.length, ...orderedOptions)
    
    filterOptions.value.forEach(opt => {
      if (scheme.filterOrder.includes(opt.key)) {
        opt.checked = true
        filterParams.value[opt.key] = scheme.filters?.[opt.key] || ''
      } else {
        opt.checked = false
      }
    })
  }
  
  originalDefaultValues.value = { ...scheme.filters }
  currentScheme.value = scheme.id
  dropdownOpen.value = false
  hasModified.value = false
  
  saveLastUsedScheme(scheme.id)
  
  setTimeout(() => {
    isRecordingBaseline.value = false
  }, 300)
  
  fetchData(filterParams.value)
}

async function saveSchemeToApi(scheme: FilterScheme) {
  try {
    const res = await fetch(API_ENDPOINTS.MATERIAL_VIEWS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheme),
    })
    const json = await res.json()
    return json.code === 200
  } catch (e) {
    console.warn('[saveSchemeToApi] API 请求失败', e)
    return false
  }
}

async function deleteSchemeFromApi(schemeId: string) {
  try {
    const res = await fetch(`${API_ENDPOINTS.MATERIAL_VIEWS}/${schemeId}`, {
      method: 'DELETE',
    })
    const json = await res.json()
    if (json.code === 200) {
      filterSchemes.value = filterSchemes.value.filter(s => s.id !== schemeId)
      return true
    }
    return false
  } catch (e) {
    console.warn('[deleteSchemeFromApi] API 请求失败', e)
    return false
  }
}

function handleSchemeChange(schemeId: string) {
  viewInitialized.value = true
  isRecordingBaseline.value = true
  initializedFilterParams.value = {}
  hasSearched.value = false
  
  if (!schemeId || schemeId === 'default') {
    currentScheme.value = 'default'
    filterParams.value = {}
    filterOptions.value.forEach(opt => {
      opt.checked = true
    })
    dropdownOpen.value = false
    hasModified.value = false
    fetchData()
    
    setTimeout(() => {
      isRecordingBaseline.value = false
    }, 300)
    return
  }
  
  const scheme = filterSchemes.value.find(s => s.id === schemeId)
  if (scheme) {
    applyScheme(scheme)
  }
}

watch(filterParams, (newVal) => {
  if (!viewInitialized.value) {
    return
  }
  
  if (isRecordingBaseline.value) {
    if (Object.keys(initializedFilterParams.value).length === 0) {
      initializedFilterParams.value = JSON.parse(JSON.stringify(newVal))
    } else {
      initializedFilterParams.value = JSON.parse(JSON.stringify(newVal))
    }
    return
  }
  
  const allKeys = new Set([...Object.keys(initializedFilterParams.value), ...Object.keys(newVal)])
  const changed = Array.from(allKeys).some(key => {
    const oldVal = initializedFilterParams.value[key]
    const newValItem = newVal[key]
    const isChanged = JSON.stringify(oldVal) !== JSON.stringify(newValItem)
    return isChanged
  })
  
  hasModified.value = changed
}, { deep: true })

async function handleSave() {
  if (!currentScheme.value || currentScheme.value === 'default') {
    message.warning('请先选择一个视图再保存')
    return
  }
  
  const scheme = filterSchemes.value.find(s => s.id === currentScheme.value)
  if (scheme) {
    scheme.filters = { ...filterParams.value }
    const success = await saveSchemeToApi(scheme)
    if (success) {
      message.success('保存成功')
      hasModified.value = false
      hasSearched.value = false
      originalDefaultValues.value = { ...filterParams.value }
      initializedFilterParams.value = JSON.parse(JSON.stringify(filterParams.value))
    } else {
      message.error('保存失败，请重试')
    }
  }
}

function handleEditScheme(schemeId: string) {
  const scheme = filterSchemes.value.find(s => s.id === schemeId)
  if (!scheme) return
  
  dropdownOpen.value = false
  isEditMode.value = true
  editingSchemeId.value = schemeId
  newSchemeName.value = scheme.name
  filterParams.value = { ...scheme.filters }
  
  dialogFilterOptions.value.forEach((opt, index) => {
    const isChecked = !!(scheme.filterOrder && scheme.filterOrder.includes(opt.key))
    const defaultValue = scheme.filters?.[opt.key]
    dialogFilterOptions.value.splice(index, 1, { ...opt, checked: isChecked, defaultValue })
  })
  
  dropdownOpen.value = false
  saveSchemeDialogVisible.value = true
}

function handleSaveAs() {
  dropdownOpen.value = false
  
  isEditMode.value = false
  editingSchemeId.value = null
  newSchemeName.value = ''
  hasSearched.value = false
  
  dialogFilterOptions.value.forEach((opt, index) => {
    const isChecked = filterOptions.value.some(f => f.key === opt.key && f.checked)
    const defaultValue = filterParams.value[opt.key] || ''
    dialogFilterOptions.value.splice(index, 1, { ...opt, checked: isChecked, defaultValue })
  })
  
  saveSchemeDialogVisible.value = true
}

function handleDrawerClose() {
  newSchemeName.value = ''
  saveSchemeDialogVisible.value = false
  isEditMode.value = false
  editingSchemeId.value = null
}

async function confirmSaveScheme() {
  if (!newSchemeName.value.trim()) {
    message.warning('请输入视图名称')
    return
  }
  
  if (newSchemeName.value.length > 8) {
    message.warning('视图名称不能超过8个字')
    return
  }
  
  const nameExists = filterSchemes.value.some(s => 
    s.name === newSchemeName.value.trim() && s.id !== editingSchemeId.value
  )
  if (nameExists) {
    message.warning('视图名称已存在')
    return
  }
  
  const selectedCount = dialogFilterOptions.value.filter(opt => opt.checked).length
  if (selectedCount === 0) {
    message.warning('请至少选择一个筛选条件')
    return
  }
  
  const selectedFilters: Record<string, any> = {}
  const filterOrder: string[] = []
  
  dialogFilterOptions.value.forEach(opt => {
    if (opt.checked) {
      selectedFilters[opt.key] = opt.defaultValue || ''
      filterOrder.push(opt.key)
    }
  })
  
  if (isEditMode.value && editingSchemeId.value) {
    const scheme = filterSchemes.value.find(s => s.id === editingSchemeId.value)
    if (!scheme) {
      message.error('未找到要编辑的视图')
      return
    }
    scheme.name = newSchemeName.value.trim()
    scheme.filters = selectedFilters
    scheme.filterOrder = filterOrder
    const success = await saveSchemeToApi(scheme)
    if (success) {
      message.success('保存成功')
      handleDrawerClose()
      applyScheme(scheme)
    } else {
      message.error('保存失败，请重试')
      return
    }
  } else {
    const scheme: FilterScheme = {
      id: Date.now().toString(),
      name: newSchemeName.value.trim(),
      filters: selectedFilters,
      createdAt: new Date().toISOString(),
      userId: getCurrentUserId(),
      filterOrder: filterOrder
    }
    filterSchemes.value.push(scheme)
    const success = await saveSchemeToApi(scheme)
    if (success) {
      message.success('保存成功')
      applyScheme(scheme)
    } else {
      message.error('保存失败，请重试')
      return
    }
  }
  
  newSchemeName.value = ''
  saveSchemeDialogVisible.value = false
  isEditMode.value = false
  editingSchemeId.value = null
}

async function handleDeleteScheme(schemeId: string) {
  const success = await deleteSchemeFromApi(schemeId)
  if (success) {
    if (currentScheme.value === schemeId) {
      currentScheme.value = 'default'
    }
    message.success('删除成功')
  } else {
    message.error('删除失败，请重试')
  }
}

function handleDragStart(event: DragEvent, index: number) {
  dragIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function handleDragOver(event: DragEvent, _index: number) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function handleDrop(event: DragEvent, index: number) {
  event.preventDefault()
  if (dragIndex.value === null || dragIndex.value === index) return
  
  const items = dialogFilterOptions.value
  const dragItem = items[dragIndex.value]
  items.splice(dragIndex.value, 1)
  items.splice(index, 0, dragItem)
  dragIndex.value = null
}

function handleDragEnd() {
  dragIndex.value = null
}

function handleDialogFilterChange(e: any, index: number) {
  dialogFilterOptions.value[index].checked = e.target.checked
}

function handleDefaultValueChange(index: number, val: any) {
  dialogFilterOptions.value[index].defaultValue = val
}

function getDropdownButtonText() {
  if (!currentScheme.value || currentScheme.value === 'default') {
    return '默认视图'
  }
  const scheme = filterSchemes.value.find(s => s.id === currentScheme.value)
  return scheme ? scheme.name : '默认视图'
}

function handleMenuClick({ key }: { key: string }) {
  if (key !== 'empty-tip' && key !== 'empty') {
    handleSchemeChange(key)
  }
}

const filterItems = [
  { key: 'applicationNo', label: '申请单号', type: 'input', placeholder: '请输入申请单号' },
  { key: 'materialName', label: '材料名称', type: 'input', placeholder: '请输入材料名称' },
  { key: 'spec', label: '规格型号', type: 'input', placeholder: '请输入规格型号' },
  { key: 'unit', label: '单位', type: 'input', placeholder: '请输入单位' },
  { key: 'quantity', label: '申请数量', type: 'input', placeholder: '请输入申请数量' },
  { key: 'materialQuantity', label: '材料数量', type: 'input', placeholder: '请输入材料数量' },
  { key: 'applicant', label: '申请人', type: 'input', placeholder: '请输入申请人' },
  { key: 'status', label: '状态', type: 'select', options: [
    { label: '全部', value: '' },
    { label: '草稿', value: 'draft' },
    { label: '审核中', value: 'pending' },
    { label: '已通过', value: 'approved' },
    { label: '已拒绝', value: 'rejected' },
  ]},
  { key: 'department', label: '部门', type: 'select', options: [
    { label: '全部', value: '' },
    { label: '工程部', value: 'engineering' },
    { label: '采购部', value: 'procurement' },
    { label: '财务部', value: 'finance' },
  ]},
  { key: 'dateRange', label: '申请日期', type: 'daterange', startPlaceholder: '开始日期', endPlaceholder: '结束日期' },
]

const filteredFilterItems = computed(() => {
  return filterOptions.value
    .filter(opt => opt.checked)
    .map(opt => {
      const filterItem = filterItems.find(item => item.key === opt.key)
      return filterItem ? { ...filterItem } : null
    })
    .filter(item => item !== null)
})

const columns = computed(() => {
  const visibleFields = columnFields.value.filter(field => field.visible || field.key === 'action')
  const regularFields = visibleFields
    .filter(field => field.key !== 'action')
    .map(field => ({
      title: field.label,
      dataIndex: field.key,
      key: field.key,
      width: field.width,
      fixed: field.fixed,
    }))
  
  const actionField = columnFields.value.find(field => field.key === 'action')
  if (actionField) {
    regularFields.push({
      title: '操作',
      dataIndex: undefined as unknown as string,
      key: 'action',
      width: actionField.width,
      fixed: 'right',
    })
  }
  
  return regularFields
})

function handleFilterParamsChange(data: Record<string, any>) {
  console.log('[handleFilterParamsChange] data:', JSON.stringify(data))
}

async function fetchData(searchParams?: Record<string, any>) {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('current', '1')
    params.append('size', '100')
    
    const filters = searchParams || {}
    if (filters.applicationNo) params.append('applicationNo', filters.applicationNo)
    if (filters.materialName) params.append('materialName', filters.materialName)
    if (filters.spec) params.append('spec', filters.spec)
    if (filters.unit) params.append('unit', filters.unit)
    if (filters.applicant) params.append('applicant', filters.applicant)
    if (filters.status) params.append('status', filters.status)
    if (filters.department) params.append('department', filters.department)
    if (filters.dateRange && filters.dateRange.length === 2) {
      const start = filters.dateRange[0]
      const end = filters.dateRange[1]
      if (start) params.append('startDate', formatDate(start))
      if (end) params.append('endDate', formatDate(end))
    }

    const res = await fetch(`${API_ENDPOINTS.MATERIALS}?` + params.toString())
    const json = await res.json()
    if (json.code === 200) {
      dataSource.value = json.data?.records || json.data || []
      const total = json.data?.total || json.data?.length || (Array.isArray(json.data) ? json.data.length : 0)
      paginationConfig.value.total = total
    }
  } catch (e) {
    console.error('获取数据失败', e)
    message.error('材料申请列表加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

function handleReset() {
  isRecordingBaseline.value = true
  
  if (!currentScheme.value || currentScheme.value === 'default') {
    Object.keys(filterParams.value).forEach(k => delete filterParams.value[k])
  } else {
    Object.keys(filterParams.value).forEach(k => delete filterParams.value[k])
    Object.assign(filterParams.value, originalDefaultValues.value)
  }
  
  hasModified.value = false
  hasSearched.value = false
  
  fetchData(filterParams.value)
  
  setTimeout(() => {
    isRecordingBaseline.value = false
  }, 100)
}

function handleAdd() {
  router.push('/materials/create')
}

function handleDetail(record: any) {
  router.push(`/materials/${record.id}`)
}

function handleEdit(record: any) {
  router.push(`/materials/${record.id}/edit`)
}

function handleSubmit(record: any) {
  console.log('submit', record)
}

function handleDelete(record: any) {
  console.log('delete', record)
  fetchData()
}

function getActionButtons(record: any) {
  return [
    { key: 'detail', label: '详情', onClick: () => handleDetail(record) },
    { key: 'edit', label: '编辑', onClick: () => handleEdit(record) },
    { key: 'submit', label: '提交', onClick: () => handleSubmit(record) },
    { key: 'delete', label: '删除', danger: true, confirm: true, confirmTitle: '确定删除？', onClick: () => handleDelete(record) },
  ]
}

function handleBatchExport() {
  console.log('batch export')
}

function handleBatchImport() {
  console.log('batch import')
}

function handleExportMenuClick({ key }: { key: string }) {
  if (key === 'export-all') {
    console.log('导出全部')
  } else if (key === 'export-selected') {
    console.log('导出选中')
  }
}

function handleSearch() {
  hasSearched.value = true
  fetchData(filterParams.value)
}

async function loadColumnSettings() {
  try {
    const res = await fetch(`${API_ENDPOINTS.USER_PREFERENCES}?key=material-column-settings`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    
    if (res.ok) {
      const json = await res.json()
      if (json.code === 200 && json.data) {
        const savedColumns = JSON.parse(json.data)
        if (savedColumns && Array.isArray(savedColumns.columns)) {
          columnFields.value = savedColumns.columns
          return
        }
      }
    }
    columnFields.value = JSON.parse(JSON.stringify(defaultColumnFields.value))
  } catch (e) {
    console.error('加载列设置失败', e)
    columnFields.value = JSON.parse(JSON.stringify(defaultColumnFields.value))
  }
}

async function saveColumnSettings(fields: ColumnField[]) {
  try {
    const res = await fetch(API_ENDPOINTS.MATERIAL_VIEWS, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'material-column-settings',
        value: JSON.stringify({ columns: fields }),
      }),
    })
    
    if (res.ok) {
      const json = await res.json()
      if (json.code === 200) {
        message.success('列设置已保存')
        return true
      }
    }
    message.warning('保存列设置失败')
    return false
  } catch (e) {
    console.error('保存列设置失败', e)
    message.error('保存列设置失败')
    return false
  }
}

function handleColumnSettingsConfirm(fields: ColumnField[]) {
  saveColumnSettings(fields)
  columnFields.value = fields
}

function handleColumnSettingsReset() {
  columnFields.value = JSON.parse(JSON.stringify(defaultColumnFields.value))
}

onMounted(async () => {
  viewInitialized.value = true
  isRecordingBaseline.value = true
  hasSearched.value = false
  
  await Promise.all([
    loadSchemes(),
    loadColumnSettings(),
  ])
  fetchData()
  
  setTimeout(() => {
    isRecordingBaseline.value = false
  }, 300)
})
</script>

<style scoped>
.danger {
  color: #F44336;
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

:deep(.dropdown-text-btn) {
  display: inline-flex !important;
  align-items: center !important;
  color: rgba(0, 0, 0, 0.88) !important;
  font-weight: normal !important;
  background: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
  outline: none !important;
  padding-left: 4px !important;
  
  &:hover,
  &:focus,
  &:focus-visible,
  &:active {
    background: transparent !important;
    border-color: transparent !important;
    box-shadow: none !important;
    outline: none !important;
    color: rgba(0, 0, 0, 0.88) !important;
  }
  padding-right: 0px !important;
  
  &.ant-btn:focus,
  &.ant-btn-focused {
    background: transparent !important;
    border-color: transparent !important;
    box-shadow: none !important;
    outline: none !important;
    color: rgba(0, 0, 0, 0.88) !important;
  }
}

:deep(.scheme-option) {
  display: flex;
  align-items: center;
  width: 100%;
}

:deep(.scheme-option .action-icons) {
  margin-left: 8px;
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.scheme-option:hover .action-icons) {
  opacity: 1;
}

:deep(.scheme-option .action-icon) {
  cursor: pointer;
  color: #999;
  transition: color 0.2s;
}

:deep(.scheme-option .action-icon.edit-icon) {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

:deep(.scheme-option .action-icon.edit-icon:hover) {
  color: #F95914;
}

:deep(.scheme-option .action-icon.delete-icon:hover) {
  color: #ff4d4f;
}

:deep(.save-filter-btn) {
  height: 26px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
}

:deep(.dropdown-text-btn) {
  .modified-tag-inline {
    display: inline-flex;
    align-items: center;
    height: 20px;
    padding: 0 6px;
    font-size: 11px;
    color: #F95914;
    background-color: #FFF2E8;
    border-radius: 3px;
    margin-left: 6px;
    flex-shrink: 0;
  }
}

.input-with-count {
  position: relative;
  width: 100%;
}

.input-with-count :deep(.ant-input-affix-wrapper) {
  width: 100%;
}

.word-count {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  pointer-events: none;
  background: #fff;
  padding-left: 4px;
}

.page-header-line {
  width: 1px;
  height: 14px;
  background-color: #d9d9d9;
  flex-shrink: 0;
}

.drawer-content {
  padding: 0 0;
  overflow: visible;
}

.form-item {
  margin-bottom: 32px;
}

.form-label {
  font-size: 14px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.88);
  margin-bottom: 8px;
}

.required-star {
  color: #ff4d4f;
  margin-left: 4px;
}

.filter-list-hint {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 8px;
}

.filter-list-container {
  padding: 0;
}

.filter-item {
  display: flex;
  flex-direction: column;
  padding: 4px 0;
  margin: 0 0 8px 0;
  border-radius: 4px;
  cursor: move;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f5f5f5;
  }
  
  &:active {
    background-color: #e6e6e6;
  }
}

.filter-row {
  display: flex;
  align-items: center;
  margin-left: 4px;
  margin-right: 4px;
}

.default-value-row {
  padding-left: 44px;
  margin-top: 4px;
  margin-bottom: 4px;
  margin-left: 4px;
  margin-right: 4px;
}

.drag-icon {
  width: 12px;
  height: 12px;
  margin-right: 8px;
  color: rgba(0, 0, 0, 0.45);
  flex-shrink: 0;
  cursor: grab;
  
  &:active {
    cursor: grabbing;
  }
}

.export-dropdown-btn:hover {
  .dropdown-arrow use {
    stroke: #F95914;
  }
}
</style>
