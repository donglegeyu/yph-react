<template>
  <div class="smart-list-template">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">{{ title }}</h2>
      <div class="page-header-actions">
        <!-- 视图选择下拉菜单 -->
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
            <a-menu @click="handleMenuClick">
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
        
        <!-- 保存和另存为按钮 -->
        <a-button v-if="hasModified && hasSearched" size="small" class="save-filter-btn" @click="handleSave">
          保存
        </a-button>
        <a-button v-if="hasModified && hasSearched" size="small" class="save-filter-btn" @click="handleSaveAs">
          另存为
        </a-button>
        
        <!-- 插槽：额外的标题栏操作 -->
        <slot name="title-actions" />
      </div>
    </div>

    <!-- 筛选区 -->
    <FilterForm
      v-if="displayFilterItems?.length"
      v-model:model-value="filterParams"
      :items="(displayFilterItems as any)"
      @search="handleSearch"
      @reset="handleReset"
      @change="handleFilterChange"
    />

    <!-- 间距分隔层 -->
    <div class="filter-gap" />

    <!-- 工具栏 + 表格 + 分页 容器 -->
    <div class="content-card">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <slot name="toolbar-actions" />
        </div>
        <div class="toolbar-right">
          <!-- 列设置按钮 -->
          <slot name="toolbar-right-actions" />
        </div>
      </div>

      <!-- 表格 -->
      <div class="table-wrapper">
        <a-table
          :data-source="dataSource"
          :columns="displayColumns"
          :loading="loading"
          :pagination="false"
          :scroll="{ y: tableHeight }"
          :row-selection="(rowSelection as any)"
          :row-key="rowKey"
          :default-expand-all-rows="treeConfig?.enabled && defaultExpandAll"
          @change="handleTableChange"
          @expand="handleExpand"
        >
          <!-- bodyCell 插槽：统一处理 -->
          <template #bodyCell="{ column, record }">
            <slot name="bodyCell" v-bind="{ column, record }" />
          </template>
        </a-table>
      </div>

      <!-- 分页 -->
      <div v-if="pagination !== false" class="pagination">
        <a-pagination
          v-model:current="paginationConfig.current"
          v-model:page-size="paginationConfig.pageSize"
          :total="paginationConfig.total"
          :show-total="(total: number) => `共 ${total} 条`"
          :show-size-changer="true"
          :show-quick-jumper="true"
          :locale="zhCN.Pagination"
          @change="handlePageChange"
        />
      </div>
    </div>

    <!-- 视图编辑抽屉 -->
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
              :class="{ 'dragging': dragIndex === index }"
              draggable="true"
              @dragstart="handleDragStart($event, index)"
              @dragover.prevent="handleDragOver($event, index)"
              @dragenter.prevent="handleDragEnter($event, index)"
              @drop="handleDrop($event, index)"
              @dragend="handleDragEnd"
            >
              <div class="filter-row">
                <svg class="drag-icon" viewBox="0 0 48 48">
                  <use href="#drag" />
                </svg>
                <a-checkbox 
                  :checked="item.checked" 
                  @change="(e: any) => handleDialogFilterChange(e, index)"
                >
                  {{ item.label }}
                </a-checkbox>
              </div>
              <div class="default-value-row" v-if="item.checked">
                <a-select
                  v-if="item.options"
                  :value="(item.defaultValue as any)"
                  @change="(val: any) => handleDefaultValueChange(index, val)"
                  :options="item.options"
                  placeholder="默认值"
                  style="width: 100%;"
                  allow-clear
                />
                <a-input
                  v-else
                  :value="(item.defaultValue as any)"
                  @input="(e: any) => handleDefaultValueChange(index, e.target.value)"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import FilterForm from './FilterForm.vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import type { FieldDefinition, TreeConfig, FilterScheme, FilterOption, PaginationConfig } from '@/types'

type RecordType = Record<string, unknown>

interface Props {
  title?: string
  fields?: FieldDefinition[]
  dataSource?: RecordType[]
  loading?: boolean
  pagination?: PaginationConfig | boolean
  rowSelection?: object | null
  rowKey?: string | ((record: RecordType) => string)
  viewEndpoint?: string
  viewType?: string
  defaultExpandAll?: boolean
  treeConfig?: TreeConfig
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  fields: () => [],
  dataSource: () => [],
  loading: false,
  pagination: true,
  rowSelection: null,
  rowKey: 'id',
  viewEndpoint: '/api/views',
  viewType: 'default',
  defaultExpandAll: true,
  treeConfig: () => ({ enabled: false }),
})

// ==================== Emits 定义 ====================
const emit = defineEmits([
  'search', 
  'reset', 
  'change', 
  'update:pagination',
  'view-change',
  'update:pagination',
  'expand'
])

// ==================== 状态变量 ====================
const filterParams = defineModel<Record<string, unknown>>('filter-model-value', { default: () => ({}) })

const dropdownOpen = ref(false)
const saveSchemeDialogVisible = ref(false)
const newSchemeName = ref('')
const isEditMode = ref(false)
const editingSchemeId = ref<string | null>(null)
const hasModified = ref(false)
const hasSearched = ref(false)
const isRecordingBaseline = ref(false)
const initializedFilterParams = ref<Record<string, unknown>>({})
const dragIndex = ref<number | null>(null)
const currentScheme = ref<string>('')
const expandedRowKeys = ref<string[]>([])

const paginationConfig = ref({
  current: 1,
  pageSize: 20,
  total: 0
})

const tableHeight = ref(400)

// ==================== 视图数据结构 ====================
const filterSchemes = ref<FilterScheme[]>([])

// ==================== 视图管理选项（dialogFilterOptions） ====================
const dialogFilterOptions = ref<FilterOption[]>([])

// 非业务字段列表（不参与视图条件保存）
const nonBusinessFields = ['action', 'index', 'checkbox', 'selection']

// 监听 props.fields 变化，自动更新 dialogFilterOptions（过滤非业务字段）
watch(() => props.fields, (newFields) => {
  if (!newFields || newFields.length === 0) return
  
  const updatedOptions = newFields
    .filter(field => !nonBusinessFields.includes(field.key)) // 过滤非业务字段
    .map(field => {
      const existing = dialogFilterOptions.value.find(opt => opt.key === field.key)
      return {
        key: field.key,
        label: field.label,
        checked: existing?.checked || false,
        defaultValue: (existing?.defaultValue || '') as any,
        options: field.options,
        type: field.type,
        placeholder: field.placeholder,
      }
    })
  
  dialogFilterOptions.value = updatedOptions as any
}, { immediate: true, deep: true })

// ==================== 计算属性：三端同步 ====================

// 1. 视图管理选项（已改为 ref，上方定义）

// 2. 筛选表单显示的字段（根据当前视图过滤并排序）
const displayFilterItems = computed(() => {
  const fields = props.fields.filter(field => !nonBusinessFields.includes(field.key))
  
  if (!currentScheme.value || currentScheme.value === 'default') {
    return fields
  }
  
  const scheme = filterSchemes.value.find(s => s.id === currentScheme.value)
  if (!scheme) return fields
  
  const filterOrder = scheme.filterOrder || []
  const filteredFields = fields.filter(field => {
    return filterOrder.includes(field.key)
  })
  
  if (filterOrder.length > 0) {
    return filteredFields.sort((a, b) => {
      const indexA = filterOrder.indexOf(a.key)
      const indexB = filterOrder.indexOf(b.key)
      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })
  }
  
  return filteredFields
})

// 3. 表格列显示（显示所有字段 + 操作列）
const displayColumns = computed(() => {
  const regularFields = props.fields.filter(field => field.key !== 'action')
  const actionField = props.fields.find(field => field.key === 'action')
  
  const regularColumns = regularFields.map(field => ({
    title: field.label,
    dataIndex: field.key,
    key: field.key,
    width: field.width || 120,
    fixed: field.fixed,
  }))
  
  if (actionField) {
    regularColumns.push({
      title: '操作',
      dataIndex: actionField.key,
      key: 'action',
      width: actionField.width || 148,
      fixed: 'right',
    })
  }
  
  return regularColumns
})

// ==================== 视图管理函数 ====================

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
    const res = await fetch(props.viewEndpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    
    if (res.ok) {
      const json = await res.json()
      if (json.code === 200) {
        filterSchemes.value = json.data || []
      } else {
        message.error('视图配置加载失败，将使用默认视图')
        filterSchemes.value = []
      }
    } else {
      message.error('视图配置加载失败，将使用默认视图')
      filterSchemes.value = []
    }
  } catch (e) {
    console.error('加载视图失败', e)
    message.error('视图配置加载失败，将使用默认视图')
    filterSchemes.value = []
  }
}

async function saveSchemeToApi(scheme: FilterScheme) {
  try {
    const res = await fetch(props.viewEndpoint, {
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
    const res = await fetch(`${props.viewEndpoint}/${schemeId}`, {
      method: 'DELETE',
    })
    const json = await res.json()
    if (json.code === 200) {
      filterSchemes.value = filterSchemes.value.filter(s => s.id !== schemeId)
      return true
    } else {
      message.error('删除视图失败，请稍后重试')
    }
    return false
  } catch (e) {
    console.warn('[deleteSchemeFromApi] API 请求失败', e)
    message.error('删除视图失败，请稍后重试')
    return false
  }
}

function handleSchemeChange(schemeId: string) {
  isRecordingBaseline.value = true
  initializedFilterParams.value = {}
  hasSearched.value = false
  
  if (!schemeId || schemeId === 'default') {
    currentScheme.value = 'default'
    filterParams.value = {}
    dropdownOpen.value = false
    hasModified.value = false
    
    setTimeout(() => {
      isRecordingBaseline.value = false
    }, 300)
    
    emit('view-change', { schemeId: 'default', filters: {} })
    return
  }
  
  const scheme = filterSchemes.value.find(s => s.id === schemeId)
  if (scheme) {
    Object.keys(filterParams.value).forEach(key => {
      delete filterParams.value[key]
    })
    
    if (scheme.filterOrder) {
      scheme.filterOrder.forEach(key => {
        if (scheme.filters && scheme.filters[key] !== undefined) {
          filterParams.value[key] = scheme.filters[key]
        }
      })
    }
    
    currentScheme.value = schemeId
    dropdownOpen.value = false
    hasModified.value = false
    
    setTimeout(() => {
      isRecordingBaseline.value = false
    }, 300)
    
    emit('view-change', { schemeId, filters: filterParams.value })
  }
}

function getDropdownButtonText() {
  if (!currentScheme.value || currentScheme.value === 'default') {
    return '默认视图'
  }
  const scheme = filterSchemes.value.find(s => s.id === currentScheme.value)
  return scheme ? scheme.name : '默认视图'
}

function handleMenuClick({ key }: { key: string | number }) {
  if (key !== 'empty-tip' && key !== 'empty') {
    handleSchemeChange(key as string)
  }
}

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
    dialogFilterOptions.value[index] = { ...opt, checked: isChecked, defaultValue }
  })
  
  saveSchemeDialogVisible.value = true
}

function handleSaveAs() {
  dropdownOpen.value = false
  isEditMode.value = false
  editingSchemeId.value = null
  newSchemeName.value = ''
  hasSearched.value = false
  
  dialogFilterOptions.value.forEach((opt, index) => {
    const defaultValue = filterParams.value[opt.key] || ''
    dialogFilterOptions.value[index] = { ...opt, checked: false, defaultValue }
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
  
  const selectedFilters: Record<string, unknown> = {}
  const filterOrder: string[] = []
  
  dialogFilterOptions.value.forEach(opt => {
    if (opt.checked && !nonBusinessFields.includes(opt.key)) {
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
      currentScheme.value = scheme.id
      hasModified.value = false
      handleDrawerClose()
    } else {
      message.error('保存失败，请重试')
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
      currentScheme.value = scheme.id
      hasModified.value = false
      handleDrawerClose()
    } else {
      message.error('保存失败，请重试')
    }
  }
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

function handleDragEnter(event: DragEvent, index: number) {
  event.preventDefault()
  if (dragIndex.value !== null && dragIndex.value !== index) {
    const newItems = [...dialogFilterOptions.value]
    const [draggedItem] = newItems.splice(dragIndex.value, 1)
    newItems.splice(index, 0, draggedItem)
    dialogFilterOptions.value = newItems
    dragIndex.value = index
  }
}

function handleDrop(event: DragEvent, index: number) {
  event.preventDefault()
  if (dragIndex.value === null || dragIndex.value === index) return
  
  const items = [...dialogFilterOptions.value]
  const dragItem = items[dragIndex.value]
  items.splice(dragIndex.value, 1)
  items.splice(index, 0, dragItem)
  dialogFilterOptions.value = items
  dragIndex.value = null
}

function handleDragEnd() {
  dragIndex.value = null
}

function handleDialogFilterChange(e: Event, index: number) {
  dialogFilterOptions.value[index].checked = (e.target as HTMLInputElement).checked
}

function handleDefaultValueChange(index: number, val: unknown) {
  dialogFilterOptions.value[index].defaultValue = val
}

// ==================== 树形表格功能 ====================

function handleExpand(expanded: boolean, record: RecordType) {
  const rowKey = typeof props.rowKey === 'function' 
    ? props.rowKey(record) 
    : record[props.rowKey as string] as string
  
  if (expanded) {
    if (!expandedRowKeys.value.includes(rowKey)) {
      expandedRowKeys.value.push(rowKey)
    }
  } else {
    expandedRowKeys.value = expandedRowKeys.value.filter(key => key !== rowKey)
  }
  
  emit('expand', { expanded, record, expandedRowKeys: expandedRowKeys.value })
}

// ==================== 筛选和搜索函数 ====================

function handleSearch(searchData: Record<string, unknown>) {
  hasSearched.value = true
  emit('search', searchData)
}

function handleReset() {
  isRecordingBaseline.value = true
  
  if (!currentScheme.value || currentScheme.value === 'default') {
    Object.keys(filterParams.value).forEach(k => delete filterParams.value[k])
  } else {
    const scheme = filterSchemes.value.find(s => s.id === currentScheme.value)
    if (scheme) {
      Object.keys(filterParams.value).forEach(k => delete filterParams.value[k])
      Object.assign(filterParams.value, scheme.filters)
    }
  }
  
  hasModified.value = false
  hasSearched.value = false
  emit('reset')
  
  setTimeout(() => {
    isRecordingBaseline.value = false
  }, 100)
}

function handleFilterChange(data: Record<string, unknown>) {
  emit('change', data)
}

function handleTableChange(pagination: object) {
  emit('change', pagination)
}

function handlePageChange(page: number, pageSize: number) {
  paginationConfig.value.current = page
  paginationConfig.value.pageSize = pageSize
  emit('update:pagination', { current: page, pageSize })
}

// ==================== Watch：监听筛选参数变化 ====================
watch(filterParams, (newVal) => {
  if (!isRecordingBaseline.value && hasSearched.value) {
    const allKeys = new Set([...Object.keys(initializedFilterParams.value), ...Object.keys(newVal)])
    const changed = Array.from(allKeys).some(key => {
      return JSON.stringify(initializedFilterParams.value[key]) !== JSON.stringify(newVal[key])
    })
    hasModified.value = changed
  }
  
  if (isRecordingBaseline.value) {
    initializedFilterParams.value = JSON.parse(JSON.stringify(newVal))
  }
}, { deep: true })

// ==================== 生命周期 ====================
onMounted(async () => {
  isRecordingBaseline.value = true
  hasSearched.value = false
  
  await loadSchemes()
  
  setTimeout(() => {
    isRecordingBaseline.value = false
  }, 300)
  
  updateTableHeight()
  window.addEventListener('resize', updateTableHeight)
})

function updateTableHeight() {
  const header = document.querySelector('.page-header')?.clientHeight || 0
  const filter = document.querySelector('.filter-form')?.clientHeight || 0
  const toolbar = document.querySelector('.toolbar')?.clientHeight || 0
  const pagination = document.querySelector('.pagination')?.clientHeight || 56
  const container = document.querySelector('.smart-list-template')?.clientHeight || 0
  
  const used = header + filter + toolbar + pagination + 32
  tableHeight.value = Math.max(300, container - used)
}
</script>

<style scoped lang="scss">
.smart-list-template {
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0rem 0.75rem;
  flex-grow: 1;
  align-self: stretch;
  z-index: 1;
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 0;
  gap: 16px;
  align-self: stretch;
  z-index: 0;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
  margin: 0;
  line-height: 24px;
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 0;
  margin-right: 0;
  flex-shrink: 0;
}

.page-header-line {
  width: 1px;
  height: 18px;
  background-color: #d9d9d9;
}

.filter-gap {
  height: 12px;
  flex-shrink: 0;
}

.content-card {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  flex-grow: 1;
  align-self: stretch;
  z-index: 3;
  border-radius: 0.38rem 0.38rem 0rem 0rem;
  background: #FFFFFF;
  overflow: hidden;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  flex-shrink: 0;
}

:deep(.export-dropdown-btn) {
  display: inline-flex;
  align-items: center;
  padding-right: 8px;
}

:deep(.dropdown-arrow) {
  margin-left: 4px;
}

// 视图管理相关样式
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
  padding-right: 0px !important;
  
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

// 抽屉样式
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
  padding: 4px 0 12px 0;
  margin: 0;
  border-radius: 4px;
  cursor: grab;
  transition: background-color 0.2s, transform 0.1s;
  user-select: none;
  
  &:hover {
    background-color: #f5f5f5;
  }
  
  &:active {
    cursor: grabbing;
    transform: scale(1.02);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    background-color: #e6e6e6;
  }
  
  &.dragging {
    opacity: 0.5;
    background-color: #fff2e8;
    border: 1px dashed #F95914;
    cursor: grabbing;
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

:deep(.ant-table) {
  border-radius: 0;
}

:deep(.ant-table-thead > tr > th) {
  border-top: none;
  border-radius: 0;
}
</style>
