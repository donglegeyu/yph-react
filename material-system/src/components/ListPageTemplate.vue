<template>
  <div class="list-page-template">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">{{ title }}</h2>
      <div class="page-header-actions">
        <!-- 视图选择器 -->
        <a-dropdown v-if="showViewSelector" :trigger="['click']" v-model:open="viewDropdownOpen">
          <a-button class="view-dropdown-btn">
            {{ viewDropdownText }}
            <svg viewBox="0 0 48 48" style="width:14px;height:14px;margin-left:4px" class="dropdown-arrow">
              <use href="#down" />
            </svg>
          </a-button>
          <template #overlay>
            <a-menu @click="handleViewMenuClick">
              <a-menu-item key="default">
                <div class="scheme-option">
                  <span @click.stop="handleDefaultView">默认视图</span>
                  <span style="font-size: 12px; color: rgba(0, 0, 0, 0.45);">（全量）</span>
                </div>
              </a-menu-item>
              <a-menu-item 
                v-for="scheme in viewSchemes" 
                :key="scheme.id"
              >
                <div class="scheme-option">
                  <span @click.stop="handleSchemeChange(scheme.id)">{{ scheme.name }}</span>
                  <span style="margin-left: 0px; font-size: 12px; color: rgba(0, 0, 0, 0.45);">（{{ scheme.filterOrder?.length || 0 }}）</span>
                  <span class="action-icons" v-if="showSchemeActions">
                    <svg 
                      class="action-icon edit-icon"
                      viewBox="0 0 48 48"
                      @click.stop="handleEditScheme(scheme.id, scheme.name)"
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
              <a-menu-divider v-if="showAddView" />
              <a-menu-item key="add-view" v-if="showAddView" @click="handleAddView">
                <span style="color: #F95914">+ 新增视图</span>
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
        <!-- 视图操作按钮 -->
        <a-button v-if="showViewSelector && hasModified && hasSearched" size="small" class="save-filter-btn" @click="handleSave">
          保存
        </a-button>
        <a-button v-if="showViewSelector && hasModified && hasSearched" size="small" class="save-filter-btn" @click="handleSaveAs">
          另存为
        </a-button>
        <slot name="title-actions" />
      </div>
    </div>

    <!-- 筛选区 -->
    <FilterForm
      v-if="filterItems?.length"
      v-model:model-value="filterParams"
      :items="filterItems"
      @search="handleSearch"
      @reset="handleReset"
      @change="(data) => emit('change', data)"
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
      </div>

      <!-- 表格 -->
      <div class="table-wrapper">
        <a-table
          :data-source="dataSource"
          :columns="columns"
          :loading="loading"
          :pagination="false"
          :scroll="{ y: tableHeight }"
          :row-selection="(rowSelection as any)"
          :row-key="rowKey"
          @change="handleTableChange"
        >
          <template v-for="slot in slots" #[slot]="slotProps" :key="slot">
            <slot :name="slot" v-bind="slotProps" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, useSlots, onMounted } from 'vue'
import FilterForm from './FilterForm.vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import type { FilterScheme, FilterItem, TableColumn, PaginationConfig } from '@/types'

type RecordType = Record<string, unknown>

interface Props {
  title?: string
  filterItems?: FilterItem[]
  columns?: TableColumn[]
  dataSource?: RecordType[]
  loading?: boolean
  pagination?: PaginationConfig | boolean
  rowSelection?: object | null
  rowKey?: string | ((record: RecordType) => string)
  // 视图相关 props
  showViewSelector?: boolean
  viewSchemes?: FilterScheme[]
  currentViewId?: string
  viewDropdownText?: string
  showSchemeActions?: boolean
  showAddView?: boolean
  hasModified?: boolean
  hasSearched?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  filterItems: () => [],
  columns: () => [],
  dataSource: () => [],
  loading: false,
  pagination: true,
  rowSelection: null,
  rowKey: 'id',
  showViewSelector: false,
  viewSchemes: () => [],
  currentViewId: 'default',
  viewDropdownText: '默认视图',
  showSchemeActions: false,
  showAddView: false,
  hasModified: false,
  hasSearched: false,
})

const emit = defineEmits([
  'search', 'reset', 'add', 'refresh', 'change', 'update:pagination',
  'view-change', 'default-view', 'edit-scheme', 'delete-scheme', 'add-view', 'save', 'save-as'
])

const slots = Object.keys(useSlots())

// 视图下拉菜单状态
const viewDropdownOpen = ref(false)

// 视图相关方法
function handleViewMenuClick(menuInfo: { key: string | number }) {
  const key = String(menuInfo.key)
  if (key === 'default') {
    handleDefaultView()
  } else {
    handleSchemeChange(key)
  }
  viewDropdownOpen.value = false
}

function handleDefaultView() {
  emit('default-view')
  viewDropdownOpen.value = false
}

function handleSchemeChange(schemeId: string) {
  emit('view-change', schemeId)
  viewDropdownOpen.value = false
}

function handleEditScheme(schemeId: string, schemeName: string) {
  emit('edit-scheme', { id: schemeId, name: schemeName })
  viewDropdownOpen.value = false
}

function handleDeleteScheme(schemeId: string) {
  emit('delete-scheme', schemeId)
  viewDropdownOpen.value = false
}

function handleAddView() {
  emit('add-view')
  viewDropdownOpen.value = false
}

function handleSave() {
  emit('save')
}

function handleSaveAs() {
  emit('save-as')
}
const filterParams = defineModel<Record<string, unknown>>('filter-model-value', { default: () => ({}) })

const tableHeight = ref(400)

const localPagination = ref({
  current: 1,
  pageSize: 20,
  total: 0
})

const paginationConfig = computed(() => {
  if (props.pagination && typeof props.pagination === 'object') {
    return props.pagination
  }
  return localPagination.value
})

function handleSearch(searchData: Record<string, unknown>) {
  emit('search', searchData)
}

function handleReset() {
  emit('reset')
}

function handleTableChange(pagination: object) {
  emit('change', pagination)
}

function handlePageChange(page: number, pageSize: number) {
  emit('update:pagination', { current: page, pageSize })
}

onMounted(() => {
  const updateHeight = () => {
    const header = document.querySelector('.page-header')?.clientHeight || 0
    const filter = document.querySelector('.filter-form')?.clientHeight || 0
    const toolbar = document.querySelector('.toolbar')?.clientHeight || 0
    const pagination = document.querySelector('.pagination')?.clientHeight || 56
    const container = document.querySelector('.list-page-template')?.clientHeight || 0
    console.log('高度计算:', { header, filter, toolbar, pagination, container })
    const used = header + filter + toolbar + pagination + 32
    tableHeight.value = Math.max(300, container - used)
    console.log('tableHeight:', tableHeight.value)
  }

  updateHeight()
  window.addEventListener('resize', updateHeight)
})
</script>

<style scoped lang="scss">
.list-page-template {
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

.view-dropdown-btn {
  display: inline-flex;
  align-items: center;
  padding-right: 8px;
}

.dropdown-arrow {
  transition: transform 0.3s;
}

.scheme-option {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .action-icons {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
    
    .action-icon {
      cursor: pointer;
      color: rgba(0, 0, 0, 0.45);
      transition: color 0.2s;
      
      &:hover {
        color: #F95914;
      }
      
      &.edit-icon {
        width: 16px;
        height: 16px;
      }
      
      &.delete-icon {
        font-size: 12px;
        
        &:hover {
          color: #ff4d4f;
        }
      }
    }
  }
}

.save-filter-btn {
  background: #F95914 !important;
  border-color: #F95914 !important;
  color: #fff !important;
  
  &:hover {
    background: #e04f0c !important;
    border-color: #e04f0c !important;
  }
}

.modified-tag-inline {
  font-size: 12px;
  color: #F95914;
  margin-left: 4px;
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

// 工具栏 + 表格 + 分页 容器
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

:deep(.ant-table) {
  border-radius: 0;
}

:deep(.ant-table-thead > tr > th) {
  border-top: none;
  border-radius: 0;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  flex-shrink: 0;
}
</style>
