import { ref, computed, watch } from 'vue'
import type { FilterOption, FilterScheme, FilterItem, SelectOption } from '@/types'

export type { FilterOption, FilterScheme, FilterItem }
export type { SelectOption }

export interface UseFilterSyncOptions {
  defaultOptions?: FilterOption[]
  defaultItems?: FilterItem[]
}

// 筛选同步组合式函数
export function useFilterSync(options: UseFilterSyncOptions = {}) {
  // 列表页筛选区的选项
  const filterOptions = ref<FilterOption[]>(options.defaultOptions || [])
  
  // 抽屉编辑界面的选项
  const dialogFilterOptions = ref<FilterOption[]>([])
  
  // 是否已修改（用于显示保存按钮）
  const hasModified = ref(false)
  
  // 拖拽索引
  const dragIndex = ref<number | null>(null)
  
  // 筛选项目列表（用于生成 FilterForm）
  const filterItems = ref<FilterItem[]>(options.defaultItems || [])
  
  // 同步标记，避免循环更新
  let isSyncing = false
  
  // 根据 filterOptions 生成 filteredFilterItems
  const filteredFilterItems = computed(() => {
    return filterOptions.value
      .filter(opt => opt.checked)
      .map(opt => {
        const filterItem = filterItems.value.find(item => item.key === opt.key)
        return filterItem ? { ...filterItem } : null
      })
      .filter(item => item !== null) as FilterItem[]
  })
  
  // 监听 filterOptions 变化，同步到 dialogFilterOptions
  watch(filterOptions, (newVal) => {
    if (isSyncing) return
    isSyncing = true
    
    // 同步 checked 和 defaultValue 状态
    dialogFilterOptions.value = dialogFilterOptions.value.map(dialogOpt => {
      const filterOpt = newVal.find(opt => opt.key === dialogOpt.key)
      if (filterOpt) {
        return { ...dialogOpt, checked: filterOpt.checked, defaultValue: filterOpt.defaultValue }
      }
      return dialogOpt
    })
    
    isSyncing = false
  }, { deep: true })
  
  // 从视图加载筛选条件
  function loadFromScheme(scheme: FilterScheme) {
    isSyncing = true
    
    // 清空选项的选中状态
    filterOptions.value.forEach(opt => {
      opt.checked = false
      opt.defaultValue = undefined
    })
    
    if (scheme.filterOrder) {
      const filterOrder = scheme.filterOrder
      // 根据 filterOrder 重新排序 filterOptions
      const orderedOptions = [...filterOptions.value].sort((a, b) => {
        const indexA = filterOrder.indexOf(a.key)
        const indexB = filterOrder.indexOf(b.key)
        if (indexA === -1 && indexB === -1) return 0
        if (indexA === -1) return 1
        if (indexB === -1) return -1
        return indexA - indexB
      })
      filterOptions.value.splice(0, filterOptions.value.length, ...orderedOptions)
      
      // 设置选中状态和默认值
      filterOptions.value.forEach(opt => {
        if (filterOrder.includes(opt.key)) {
          opt.checked = true
          opt.defaultValue = scheme.filters?.[opt.key]
        }
      })
    }
    
    // 同步到对话框
    syncToDialog()
    
    // 标记为未修改
    hasModified.value = false
    
    isSyncing = false
  }
  
  // 同步到对话框
  function syncToDialog() {
    isSyncing = true
    
    dialogFilterOptions.value = filterOptions.value.map(opt => ({
      key: opt.key,
      label: opt.label,
      checked: opt.checked,
      options: opt.options ? [...opt.options] : undefined,
      defaultValue: opt.defaultValue
    }))
    
    isSyncing = false
  }
  
  // 从对话框同步
  function syncFromDialog() {
    isSyncing = true
    
    filterOptions.value = dialogFilterOptions.value.map(opt => ({
      key: opt.key,
      label: opt.label,
      checked: opt.checked,
      options: opt.options ? [...opt.options] : undefined,
      defaultValue: opt.defaultValue
    }))
    
    // 标记为已修改
    hasModified.value = true
    
    isSyncing = false
  }
  
  // 重置为默认（全选）
  function resetToDefault() {
    isSyncing = true
    
    filterOptions.value.forEach(opt => {
      opt.checked = true
      opt.defaultValue = undefined
    })
    
    syncToDialog()
    hasModified.value = false
    
    isSyncing = false
  }
  
  // 打开抽屉时同步当前状态
  function openDrawer() {
    syncToDialog()
  }
  
  // 拖拽开始
  function handleDragStart(index: number) {
    dragIndex.value = index
  }
  
  // 拖拽结束
  function handleDragEnd() {
    dragIndex.value = null
  }
  
  // 拖拽放置
  function handleDrop(targetIndex: number) {
    if (dragIndex.value === null || dragIndex.value === targetIndex) return
    
    // 在 dialogFilterOptions 中移动
    const items = dialogFilterOptions.value
    const dragItem = items[dragIndex.value]
    items.splice(dragIndex.value, 1)
    items.splice(targetIndex, 0, dragItem)
    dragIndex.value = null
    
    // 标记为已修改
    hasModified.value = true
  }
  
  // 更新对话框中的选项勾选状态
  function updateDialogChecked(index: number, checked: boolean) {
    if (dialogFilterOptions.value[index]) {
      dialogFilterOptions.value[index].checked = checked
      hasModified.value = true
    }
  }
  
  // 更新对话框中的默认值
  function updateDialogDefaultValue(index: number, value: unknown) {
    if (dialogFilterOptions.value[index]) {
      dialogFilterOptions.value[index].defaultValue = value
      hasModified.value = true
    }
  }
  
  // 从视图获取保存数据
  function getSchemeData(name: string, userId: string, existingId?: string): FilterScheme {
    const selectedFilters: Record<string, unknown> = {}
    const filterOrder: string[] = []
    
    // 遍历对话框里的筛选选项（只有选中的才保存）
    dialogFilterOptions.value.forEach(opt => {
      if (opt.checked) {
        selectedFilters[opt.key] = opt.defaultValue || ''
        filterOrder.push(opt.key)
      }
    })
    
    return {
      id: existingId || Date.now().toString(),
      name,
      filters: selectedFilters,
      filterOrder,
      createdAt: new Date().toISOString(),
      userId
    }
  }
  
  return {
    // 状态
    filterOptions,
    dialogFilterOptions,
    hasModified,
    dragIndex,
    filterItems,
    
    // 计算属性
    filteredFilterItems,
    
    // 方法
    loadFromScheme,
    syncToDialog,
    syncFromDialog,
    resetToDefault,
    openDrawer,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    updateDialogChecked,
    updateDialogDefaultValue,
    getSchemeData,
  }
}
