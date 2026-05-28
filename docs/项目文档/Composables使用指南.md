# Composables 使用指南

本指南详细介绍项目中使用的所有 Composables，帮助开发者快速上手并遵循最佳实践。

## 目录

- [快速开始](#快速开始)
- [useStatusMap - 状态映射管理](#usestatusmap---状态映射管理)
- [useDateFormat - 日期格式化](#usedateformat---日期格式化)
- [useListData - 列表数据管理](#uselistdata---列表数据管理)
- [useColumnSettings - 列设置持久化](#usecolumnsettings---列设置持久化)
- [useActions - 操作按钮管理](#useactions---操作按钮管理)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

---

## 快速开始

### 安装与导入

所有 Composables 都通过统一的入口文件导出：

```typescript
import { 
  useStatusMap, 
  useDateFormat, 
  useListData,
  useColumnSettings,
  useActions 
} from '@/composables'
```

### 基本使用模式

```vue
<script setup lang="ts">
import { useStatusMap, useDateFormat, useListData } from '@/composables'

// 1. 状态管理
const { getStatusText, getStatusColor } = useStatusMap({
  defaultStatusMap: {
    draft: { text: '草稿', color: 'default' },
    approved: { text: '已通过', color: 'success' },
  }
})

// 2. 日期格式化
const { formatDateTime, formatDate } = useDateFormat()

// 3. 数据获取
const { loading, dataSource, fetchData } = useListData({
  apiEndpoint: '/api/materials',
  defaultPageSize: 20,
})
</script>
```

---

## useStatusMap - 状态映射管理

### 功能说明

统一管理列表页中的状态映射，包括状态文本、颜色样式等。

### API 接口

```typescript
// 选项
interface UseStatusMapOptions {
  defaultStatusMap?: Record<string, StatusConfig>  // 初始状态映射
}

interface StatusConfig {
  text: string      // 显示文本
  color: string     // 样式类名
  [key: string]: any  // 其他扩展属性
}

// 返回值
function useStatusMap(options?: UseStatusMapOptions): {
  statusMap: Ref<Record<string, StatusConfig>>  // 状态映射对象
  registerStatusMap: (map: Record<string, StatusConfig>) => void  // 注册状态映射
  addStatus: (key: string, config: StatusConfig) => void  // 添加单个状态
  getStatusText: (status: string) => string  // 获取状态文本
  getStatusColor: (status: string) => string  // 获取状态颜色
  getStatusConfig: (status: string) => StatusConfig | undefined  // 获取完整配置
  hasStatus: (status: string) => boolean  // 检查状态是否存在
  getAllStatuses: () => Array<{ key: string; config: StatusConfig }>  // 获取所有状态
  clearStatusMap: () => void  // 清空状态映射
}
```

### 使用示例

#### 示例 1：基础使用

```vue
<script setup lang="ts">
import { useStatusMap } from '@/composables'

const { getStatusText, getStatusColor } = useStatusMap({
  defaultStatusMap: {
    draft: { text: '草稿', color: 'default' },
    pending: { text: '审核中', color: 'warning' },
    approved: { text: '已通过', color: 'success' },
    rejected: { text: '已拒绝', color: 'error' },
  }
})
</script>

<template>
  <a-tag :class="getStatusColor('approved')">
    {{ getStatusText('approved') }}  <!-- 显示：已通过 -->
  </a-tag>
</template>
```

#### 示例 2：动态注册

```vue
<script setup lang="ts">
import { useStatusMap } from '@/composables'

const { registerStatusMap, getStatusText } = useStatusMap()

// 页面加载后注册
onMounted(async () => {
  const response = await fetch('/api/status-config')
  const config = await response.json()
  registerStatusMap(config.statusMap)
})
</script>
```

#### 示例 3：条件状态

```vue
<script setup lang="ts">
import { useStatusMap } from '@/composables'

const { getStatusText, getStatusColor } = useStatusMap()

// 根据数据类型动态判断
function getStatusInfo(type: string, value: any) {
  if (type === 'order') {
    return {
      text: getStatusText(value),
      color: getStatusColor(value)
    }
  } else if (type === 'payment') {
    return {
      text: value === 'paid' ? '已支付' : '未支付',
      color: value === 'paid' ? 'success' : 'warning'
    }
  }
}
</script>
```

### 实际应用案例

#### 材料申请列表

```typescript
const { registerStatusMap, getStatusText, getStatusColor } = useStatusMap()

registerStatusMap({
  draft: { text: '草稿', color: 'default' },
  pending: { text: '审核中', color: 'status-pending' },
  approved: { text: '已通过', color: 'status-approved' },
  rejected: { text: '已拒绝', color: 'status-rejected' },
})
```

#### 采购订单列表

```typescript
const { registerStatusMap, getStatusText, getStatusColor } = useStatusMap()

registerStatusMap({
  draft: { text: '草稿', color: 'default' },
  pending: { text: '审核中', color: 'status-pending' },
  approved: { text: '已通过', color: 'status-approved' },
  rejected: { text: '已拒绝', color: 'status-rejected' },
  closed: { text: '已关闭', color: 'default' },
})
```

---

## useDateFormat - 日期格式化

### 功能说明

统一管理日期和时间的格式化，支持多种输出格式。

### API 接口

```typescript
// 选项
interface UseDateFormatOptions {
  defaultFormat?: string    // 默认日期时间格式
  defaultSeparator?: string // 默认日期分隔符
}

// 返回值
function useDateFormat(options?: UseDateFormatOptions): {
  defaultFormat: Ref<string>           // 默认格式（响应式）
  defaultSeparator: Ref<string>        // 默认分隔符（响应式）
  setDefaultFormat: (format: string) => void          // 设置默认格式
  setDefaultSeparator: (separator: string) => void   // 设置默认分隔符
  padZero: (num: number) => string                  // 补零
  formatDateTime: (dateTime: string | Date | null | undefined) => string  // 格式化日期时间
  formatDate: (date: string | Date | null | undefined, separator?: string) => string  // 格式化日期
  formatTime: (dateTime: string | Date | null | undefined) => string  // 格式化时间
  formatDateRange: (startDate: any, endDate: any, separator?: string) => string  // 格式化日期范围
  parseDate: (dateString: string) => Date | null  // 解析日期字符串
  getRelativeTime: (dateTime: string | Date) => string  // 获取相对时间
  isToday: (dateTime: string | Date) => boolean  // 判断是否是今天
  isValidDate: (dateString: string) => boolean  // 验证日期有效性
}
```

### 使用示例

#### 示例 1：基础格式化

```vue
<script setup lang="ts">
import { useDateFormat } from '@/composables'

const { formatDateTime, formatDate, formatTime } = useDateFormat()

// 格式化日期时间
formatDateTime('2026-04-23T10:30:00')  // '2026-04-23 10:30:00'

// 格式化日期
formatDate('2026-04-23')  // '2026-04-23'

// 格式化时间
formatTime('2026-04-23T10:30:00')  // '10:30:00'
</script>
```

#### 示例 2：自定义分隔符

```vue
<script setup lang="ts">
import { useDateFormat } from '@/composables'

const { formatDate } = useDateFormat()

// 使用斜杠分隔符
formatDate('2026-04-23', '/')  // '2026/04/23'

// 使用点分隔符
formatDate('2026-04-23', '.')  // '2026.04.23'
```

#### 示例 3：相对时间

```vue
<script setup lang="ts">
import { useDateFormat } from '@/composables'

const { getRelativeTime, isToday } = useDateFormat()

// 获取相对时间
getRelativeTime('2026-04-23T09:00:00')  // '刚刚' / '5分钟前' / '2小时前' / '3天前'

// 判断是否是今天
isToday('2026-04-23T10:00:00')  // true 或 false
</script>
```

#### 示例 4：日期范围

```vue
<script setup lang="ts">
import { useDateFormat } from '@/composables'

const { formatDateRange } = useDateFormat()

// 格式化日期范围
formatDateRange('2026-04-01', '2026-04-23')  // '2026-04-01 ~ 2026-04-23'
formatDateRange('2026-04-01', '2026-04-23', '/')  // '2026/04/01 ~ 2026/04/23'
</script>
```

### 实际应用案例

#### 列表时间格式化

```typescript
const { formatDateTime } = useDateFormat()

// 在表格中使用
columns = [
  {
    title: '申请时间',
    dataIndex: 'applyTime',
    customRender: ({ text }) => formatDateTime(text)
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    customRender: ({ text }) => formatDateTime(text)
  }
]
```

#### 筛选条件日期处理

```typescript
const { formatDate } = useDateFormat()

// 处理日期范围筛选
function handleSearch(params: any) {
  const query: any = {}
  
  if (params.dateRange && params.dateRange.length === 2) {
    query.startDate = formatDate(params.dateRange[0])
    query.endDate = formatDate(params.dateRange[1])
  }
  
  fetchData(query)
}
```

---

## useListData - 列表数据管理

### 功能说明

统一管理列表页的数据获取、分页、筛选等逻辑。

### API 接口

```typescript
// 选项
interface UseListDataOptions<T = any> {
  apiEndpoint: string                              // API 端点
  defaultPageSize?: number                         // 默认每页条数
  autoFetch?: boolean                              // 是否自动获取数据
  transformResponse?: (data: any) => T[]          // 数据转换函数
  onSuccess?: (data: T[]) => void                // 成功回调
  onError?: (error: Error) => void                // 错误回调
}

interface PaginationConfig {
  current: number   // 当前页
  pageSize: number   // 每页条数
  total: number      // 总条数
}

// 返回值
function useListData<T = any>(options: UseListDataOptions<T>): {
  loading: Ref<boolean>                    // 加载状态
  dataSource: Ref<T[]>                    // 数据源
  pagination: Ref<PaginationConfig>       // 分页配置
  filterParams: Ref<Record<string, any>>  // 筛选参数
  error: Ref<Error | null>              // 错误对象
  hasData: ComputedRef<boolean>          // 是否有数据
  isEmpty: ComputedRef<boolean>           // 是否为空
  hasFilters: ComputedRef<boolean>         // 是否有筛选条件
  fetchData: (params?: Record<string, any>) => Promise<T[]>     // 获取数据
  refresh: () => Promise<T[]>             // 刷新（重置到第一页）
  loadMore: () => Promise<T[]>            // 加载更多
  setFilterParams: (params: Record<string, any>) => void           // 设置筛选参数
  updateFilterParam: (key: string, value: any) => void            // 更新单个参数
  removeFilterParam: (key: string) => void                       // 移除参数
  clearFilterParams: () => void                                   // 清空所有参数
  setPagination: (config: Partial<PaginationConfig>) => void       // 设置分页
  resetPagination: () => void                                     // 重置分页
  handlePageChange: (page: number, pageSize?: number) => void    // 页码变化
  handlePageSizeChange: (pageSize: number) => void                // 每页条数变化
  getSelectedRows: (keys: (string | number)[]) => T[]            // 获取选中行
  getRowById: (id: string | number) => T | undefined             // 根据ID获取行
  updateRow: (id: string | number, updates: Partial<T>) => void    // 更新行
  removeRow: (id: string | number) => void                       // 删除行
  addRow: (row: T) => void                                       // 添加行
  clearData: () => void                                          // 清空数据
}
```

### 使用示例

#### 示例 1：基础使用

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useListData } from '@/composables'
import { API_ENDPOINTS } from '@/constants/api'

const { 
  loading, 
  dataSource, 
  fetchData,
  refresh 
} = useListData({
  apiEndpoint: API_ENDPOINTS.MATERIALS,
  defaultPageSize: 20,
})

onMounted(() => {
  fetchData()
})
</script>

<template>
  <a-table 
    :data-source="dataSource" 
    :loading="loading"
    :pagination="{ current: 1, pageSize: 20 }"
  >
    <!-- 列定义 -->
  </a-table>
</template>
```

#### 示例 2：带筛选条件

```vue
<script setup lang="ts">
import { useListData } from '@/composables'

const { 
  dataSource, 
  fetchData, 
  setFilterParams,
  clearFilterParams 
} = useListData({
  apiEndpoint: '/api/materials',
  defaultPageSize: 20,
})

function handleSearch(formValues: any) {
  setFilterParams(formValues)
  fetchData()
}

function handleReset() {
  clearFilterParams()
  fetchData()
}
</script>
```

#### 示例 3：自定义数据转换

```vue
<script setup lang="ts">
import { useListData } from '@/composables'

interface MaterialItem {
  id: number
  name: string
  status: string
}

const { dataSource, fetchData } = useListData<MaterialItem>({
  apiEndpoint: '/api/materials',
  transformResponse: (rawData) => {
    return rawData.map(item => ({
      ...item,
      displayName: `${item.name} (${item.spec})`,
      statusText: getStatusText(item.status),
    }))
  }
})
</script>
```

#### 示例 4：带错误处理

```vue
<script setup lang="ts">
import { useListData } from '@/composables'
import { message } from 'ant-design-vue'

const { dataSource, fetchData } = useListData({
  apiEndpoint: '/api/materials',
  onSuccess: (data) => {
    console.log('数据加载成功:', data.length)
  },
  onError: (error) => {
    message.error('加载失败: ' + error.message)
  }
})
</script>
```

### 实际应用案例

#### 材料列表页

```typescript
const { 
  loading, 
  dataSource, 
  filterParams,
  refresh,
  fetchData 
} = useListData({
  apiEndpoint: API_ENDPOINTS.MATERIALS,
  defaultPageSize: 100,
})

// 自定义 fetchData 包含筛选逻辑
async function customFetchData(searchParams?: Record<string, any>) {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('current', '1')
    params.append('size', '100')
    
    const filters = searchParams || filterParams.value
    if (filters.applicationNo) params.append('applicationNo', filters.applicationNo)
    if (filters.status) params.append('status', filters.status)
    if (filters.dateRange?.length === 2) {
      params.append('startDate', formatDate(filters.dateRange[0]))
      params.append('endDate', formatDate(filters.dateRange[1]))
    }

    const res = await fetch(`${API_ENDPOINTS.MATERIALS}?${params.toString()}`)
    const json = await res.json()
    if (json.code === 200) {
      dataSource.value = json.data?.records || []
      paginationConfig.value.total = json.data?.total || 0
    }
  } catch (e) {
    console.error('获取数据失败', e)
  } finally {
    loading.value = false
  }
}
```

---

## useColumnSettings - 列设置持久化

### 功能说明

管理表格列的显示设置，包括可见性、宽度、固定位置等，并支持持久化存储。

### API 接口

```typescript
// 选项
interface UseColumnSettingsOptions {
  pageKey: string                                  // 页面标识（用于存储 key）
  apiEndpoint?: string                             // API 端点（可选）
  storageType?: 'localStorage' | 'sessionStorage' | 'api'  // 存储方式
  onLoad?: (fields: ColumnField[]) => void         // 加载完成回调
  onSave?: (fields: ColumnField[]) => void         // 保存完成回调
}

interface ColumnField {
  key: string           // 字段标识
  label: string         // 显示名称
  visible: boolean      // 是否可见
  width?: number         // 宽度
  fixed?: 'left' | 'right'  // 固定位置
  [key: string]: any   // 其他扩展
}

// 返回值
function useColumnSettings(options: UseColumnSettingsOptions): {
  columnFields: Ref<ColumnField[]>   // 列配置
  defaultFields: Ref<ColumnField[]>  // 默认配置
  loading: Ref<boolean>              // 加载状态
  initFields: (fields: ColumnField[]) => void                // 初始化字段
  updateFieldVisibility: (key: string, visible: boolean) => void   // 更新可见性
  updateFieldWidth: (key: string, width: number) => void            // 更新宽度
  updateFieldFixed: (key: string, fixed?: 'left' | 'right') => void  // 更新固定位置
  updateFieldOrder: (fromIndex: number, toIndex: number) => void    // 更新顺序
  getVisibleFields: () => ColumnField[]          // 获取可见字段
  getHiddenFields: () => ColumnField[]          // 获取隐藏字段
  resetToDefault: () => void                     // 重置为默认
  selectAll: () => void                        // 全选
  deselectAll: () => void                      // 取消全选
  loadFromStorage: () => Promise<ColumnField[]>  // 从存储加载
  saveToStorage: () => Promise<boolean>         // 保存到存储
  confirmChanges: (fields: ColumnField[]) => void   // 确认修改
  cancelChanges: () => void                     // 取消修改
}
```

### 使用示例

#### 示例 1：基础使用

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useColumnSettings } from '@/composables'

interface ColumnField {
  key: string
  label: string
  visible: boolean
  width?: number
}

const defaultFields: ColumnField[] = [
  { key: 'name', label: '名称', visible: true, width: 180 },
  { key: 'status', label: '状态', visible: true, width: 100 },
  { key: 'date', label: '日期', visible: true, width: 150 },
]

const { 
  columnFields, 
  initFields,
  resetToDefault 
} = useColumnSettings({
  pageKey: 'material-list',
  storageType: 'localStorage',
})

onMounted(() => {
  initFields(defaultFields)
})
</script>
```

#### 示例 2：使用 API 持久化

```vue
<script setup lang="ts">
import { useColumnSettings } from '@/composables'

const { 
  columnFields, 
  loadFromStorage,
  saveToStorage,
  confirmChanges 
} = useColumnSettings({
  pageKey: 'material-list',
  storageType: 'api',
  apiEndpoint: '/api/user-preferences',
  onLoad: (fields) => {
    console.log('列设置已加载:', fields)
  },
  onSave: (fields) => {
    console.log('列设置已保存:', fields)
  }
})

// 加载设置
await loadFromStorage()

// 确认修改并保存
function handleConfirm(fields: ColumnField[]) {
  confirmChanges(fields)  // 自动保存
}
</script>
```

#### 示例 3：与 ColumnSettingsPanel 配合

```vue
<script setup lang="ts">
import { useColumnSettings } from '@/composables'
import ColumnSettingsPanel from '@/components/ColumnSettingsPanel.vue'

const { 
  columnFields, 
  defaultFields,
  confirmChanges,
  resetToDefault 
} = useColumnSettings({
  pageKey: 'material-list',
})

function handleConfirm(fields: any[]) {
  confirmChanges(fields)
}

function handleReset() {
  resetToDefault()
}
</script>

<template>
  <ColumnSettingsPanel
    :fields="columnFields"
    :default-fields="defaultFields"
    :exclude-keys="['action']"
    @confirm="handleConfirm"
    @reset="handleReset"
  >
    <a-button>
      <template #icon><SettingOutlined /></template>
    </a-button>
  </ColumnSettingsPanel>
</template>
```

---

## useActions - 操作按钮管理

### 功能说明

统一管理表格操作列的按钮，包括查看、编辑、删除等操作。

### API 接口

```typescript
// 选项
interface UseActionsOptions {
  router?: ReturnType<typeof useRouter>           // 路由实例
  detailPath?: string | ((record: any) => string)  // 详情路径
  editPath?: string | ((record: any) => string)     // 编辑路径
  deleteApi?: string                              // 删除 API
  onDeleteSuccess?: () => void                    // 删除成功回调
  onDetail?: (record: any) => void               // 详情点击回调
  onEdit?: (record: any) => void                // 编辑点击回调
  onDelete?: (record: any) => void              // 删除点击回调
  onSubmit?: (record: any) => void              // 提交点击回调
}

interface ActionButton {
  key: string                            // 按钮标识
  label: string                          // 按钮文本
  type?: 'primary' | 'default' | 'text' | 'link'  // 按钮类型
  danger?: boolean                        // 是否危险按钮
  disabled?: boolean                     // 是否禁用
  hidden?: boolean                       // 是否隐藏
  confirm?: boolean                      // 是否需要确认
  confirmTitle?: string                   // 确认标题
  confirmContent?: string                // 确认内容
  icon?: string                          // 图标
  onClick?: (record: any) => void       // 点击回调
  [key: string]: any                    // 其他属性
}

// 返回值
function useActions(options: UseActionsOptions = {}): {
  deleting: Ref<boolean>                                     // 删除中状态
  handleDetail: (record: any) => void                      // 处理详情
  handleEdit: (record: any) => void                       // 处理编辑
  handleDelete: (record: any, confirmCallback?: () => void) => Promise<boolean>  // 处理删除
  handleSubmit: (record: any) => void                    // 处理提交
  getActionButtons: (record: any, customButtons?: ActionButton[]) => ActionButton[]  // 获取按钮列表
  getDetailButton: (record: any) => ActionButton          // 获取详情按钮
  getEditButton: (record: any) => ActionButton            // 获取编辑按钮
  getDeleteButton: (record: any, confirmCallback?: () => void) => ActionButton  // 获取删除按钮
  getSubmitButton: (record: any) => ActionButton         // 获取提交按钮
  createCustomButton: (key: string, label: string, onClick: (record: any) => void, options?: Partial<ActionButton>) => ActionButton  // 创建自定义按钮
  filterVisibleButtons: (buttons: ActionButton[]) => ActionButton[]  // 过滤可见按钮
  filterEnabledButtons: (buttons: ActionButton[]) => ActionButton[]   // 过滤启用按钮
}
```

### 使用示例

#### 示例 1：基础使用

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useActions } from '@/composables'
import ActionCell from '@/components/ActionCell.vue'

const router = useRouter()

const { getActionButtons } = useActions({
  router,
  detailPath: '/materials',
  editPath: '/materials',
})

function getButtons(record: any) {
  return getActionButtons(record)
}
</script>

<template>
  <ActionCell :buttons="getButtons(record)" />
</template>
```

#### 示例 2：自定义操作

```vue
<script setup lang="ts">
import { useActions } from '@/composables'

const { getActionButtons, createCustomButton } = useActions({
  onDetail: (record) => {
    router.push(`/materials/${record.id}`)
  },
  onEdit: (record) => {
    router.push(`/materials/${record.id}/edit`)
  },
  onDeleteSuccess: () => {
    message.success('删除成功')
    refresh()
  }
})

function getButtons(record: any) {
  const customButtons = [
    createCustomButton('approve', '审批', (record) => {
      handleApprove(record)
    }, { type: 'primary' }),
    createCustomButton('export', '导出', (record) => {
      handleExport(record)
    }),
  ]
  
  return getActionButtons(record, customButtons)
}
</script>
```

#### 示例 3：条件显示按钮

```vue
<script setup lang="ts">
import { useActions } from '@/composables'

const { getActionButtons } = useActions({
  router,
  detailPath: '/materials',
  editPath: '/materials',
  onDeleteSuccess: () => refresh(),
})

function getButtons(record: any) {
  let customButtons = []
  
  // 根据状态添加不同按钮
  if (record.status === 'draft') {
    customButtons.push({
      key: 'submit',
      label: '提交',
      type: 'primary',
      onClick: () => handleSubmit(record)
    })
  }
  
  if (record.status === 'pending') {
    customButtons.push({
      key: 'approve',
      label: '审批',
      type: 'primary',
      onClick: () => handleApprove(record)
    })
  }
  
  return getActionButtons(record, customButtons)
}
</script>
```

---

## 最佳实践

### 1. 组合使用多个 Composables

```vue
<script setup lang="ts">
import { useStatusMap, useDateFormat, useListData } from '@/composables'

// 状态管理
const { getStatusText, getStatusColor } = useStatusMap({
  defaultStatusMap: {
    draft: { text: '草稿', color: 'default' },
    approved: { text: '已通过', color: 'success' },
  }
})

// 日期格式化
const { formatDateTime } = useDateFormat()

// 数据获取
const { loading, dataSource, fetchData } = useListData({
  apiEndpoint: '/api/materials',
})

// 在模板中使用
function getRow(record: any) {
  return {
    statusText: getStatusText(record.status),
    statusClass: getStatusColor(record.status),
    applyTimeText: formatDateTime(record.applyTime)
  }
}
</script>
```

### 2. 抽取页面级 Composable

为复杂页面创建专用的 composable：

```typescript
// composables/useMaterialList.ts
import { useStatusMap, useDateFormat, useListData } from '@/composables'

export function useMaterialList() {
  // 状态管理
  const { getStatusText, getStatusColor } = useStatusMap({
    defaultStatusMap: {
      draft: { text: '草稿', color: 'default' },
      pending: { text: '审核中', color: 'warning' },
      approved: { text: '已通过', color: 'success' },
      rejected: { text: '已拒绝', color: 'error' },
    }
  })

  // 日期格式化
  const { formatDateTime, formatDate } = useDateFormat()

  // 数据获取
  const { 
    loading, 
    dataSource, 
    filterParams,
    fetchData,
    refresh 
  } = useListData({
    apiEndpoint: '/api/materials',
    defaultPageSize: 100,
  })

  return {
    // 状态
    getStatusText,
    getStatusColor,
    formatDateTime,
    formatDate,
    loading,
    dataSource,
    filterParams,
    // 方法
    fetchData,
    refresh,
  }
}
```

在组件中使用：

```vue
<script setup lang="ts">
import { useMaterialList } from '@/composables'

const { 
  getStatusText, 
  getStatusColor,
  formatDateTime,
  loading, 
  dataSource, 
  fetchData 
} = useMaterialList()
</script>
```

### 3. 遵循命名规范

```typescript
// ✅ 正确的命名
useStatusMap       // use + 功能名
useDateFormat
useListData
useColumnSettings
useActions

// ❌ 错误的命名
statusMap         // 缺少 use 前缀
DateFormat         // 缺少 use 前缀
listData           // 缺少 use 前缀
```

### 4. 类型安全

```typescript
// ✅ 使用 TypeScript 类型
interface MaterialRecord {
  id: number
  name: string
  status: string
  applyTime: string
}

const { dataSource } = useListData<MaterialRecord>({
  apiEndpoint: '/api/materials'
})

// dataSource 现在是 Ref<MaterialRecord[]>
// TypeScript 能推断出类型

// ❌ 使用 any
const { dataSource } = useListData({
  apiEndpoint: '/api/materials'
})

// dataSource 是 Ref<any[]>
// 失去类型检查的好处
```

### 5. 错误处理

```typescript
const { fetchData, error } = useListData({
  apiEndpoint: '/api/materials',
  onError: (err) => {
    message.error(`加载失败: ${err.message}`)
  }
})

// 监听错误状态
watch(error, (newError) => {
  if (newError) {
    console.error('发生错误:', newError)
  }
})
```

---

## 常见问题

### Q1: 如何在非 Vue 组件文件中使用 Composables？

Composables 只能在 Vue 组件的 `setup()` 函数或 `<script setup>` 中使用。如果需要在其他地方使用，请将相关逻辑抽取为普通函数。

```typescript
// ✅ 正确：在 setup 中使用
const { getStatusText } = useStatusMap()

// ❌ 错误：在普通函数中使用
function getStatus() {
  return useStatusMap().getStatusText()  // 不推荐！
}
```

### Q2: 如何在多个组件之间共享状态？

Composables 在每个组件实例中都是独立的。如果需要共享状态，可以使用：

1. **Pinia Store** - 全局状态管理
2. **Provide/Inject** - 跨组件通信
3. **Props/Emit** - 父子组件通信

### Q3: 如何处理异步加载状态？

```typescript
const { loading, fetchData } = useListData({
  apiEndpoint: '/api/materials'
})

// 使用 computed 监听加载状态
const isLoading = computed(() => loading.value)

// 或在 watch 中处理
watch(loading, (newLoading) => {
  if (newLoading) {
    console.log('开始加载...')
  } else {
    console.log('加载完成')
  }
})
```

### Q4: 如何自定义数据获取逻辑？

```typescript
const { loading, dataSource } = useListData({
  apiEndpoint: '/api/materials'
})

// 在组件中重写 fetchData
async function fetchData(params?: Record<string, any>) {
  loading.value = true
  try {
    // 自定义逻辑
    const response = await fetch('/api/custom-endpoint', {
      method: 'POST',
      body: JSON.stringify(params)
    })
    const data = await response.json()
    dataSource.value = data.records
  } finally {
    loading.value = false
  }
}
```

### Q5: 如何实现数据缓存？

```typescript
const { loading, dataSource } = useListData({
  apiEndpoint: '/api/materials'
})

// 使用 sessionStorage 缓存
const cacheKey = 'material-list-cache'

function loadFromCache() {
  const cached = sessionStorage.getItem(cacheKey)
  if (cached) {
    dataSource.value = JSON.parse(cached)
  }
}

function saveToCache() {
  sessionStorage.setItem(cacheKey, JSON.stringify(dataSource.value))
}

onMounted(() => {
  if (dataSource.value.length === 0) {
    loadFromCache()
  }
})
```

---

## 更多资源

- [Vue 3 Composition API 文档](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Composables 最佳实践](https://vuejs.org/guide/reusability/composables.html)
- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)

---

## 更新日志

### 2026-04-23
- 初始版本发布
- 支持 5 个核心 Composables：
  - useStatusMap
  - useDateFormat
  - useListData
  - useColumnSettings
  - useActions
