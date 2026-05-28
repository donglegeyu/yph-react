import { ref, computed } from 'vue'
import type { FilterScheme, FilterOption } from '@/types'

export type { FilterScheme, FilterOption }

export interface UseViewManagerOptions {
  pageKey: string  // 页面标识，用于存储偏好
  apiBase?: string  // API 基础路径
}

// 视图管理器
export function useViewManager(options: UseViewManagerOptions) {
  const { pageKey, apiBase = '/api' } = options
  
  // 状态
  const filterSchemes = ref<FilterScheme[]>([])
  const filterOptions = ref<FilterOption[]>([])
  const currentSchemeId = ref<string>('default')
  const dropdownOpen = ref(false)
  
  // 加载视图列表
  async function loadSchemes() {
    try {
      const res = await fetch(`${apiBase}/material-views`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (res.ok) {
        const json = await res.json()
        if (json.code === 200) {
          filterSchemes.value = json.data || []
        }
      }
    } catch (e) {
      console.error('[useViewManager] 加载视图失败', e)
      filterSchemes.value = []
    }
  }
  
  // 保存视图
  async function saveScheme(scheme: FilterScheme): Promise<boolean> {
    try {
      const res = await fetch(`${apiBase}/material-views`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheme),
      })
      const json = await res.json()
      return json.code === 200
    } catch (e) {
      console.error('[useViewManager] 保存视图失败', e)
      return false
    }
  }
  
  // 删除视图
  async function deleteScheme(schemeId: string): Promise<boolean> {
    try {
      const res = await fetch(`${apiBase}/material-views/${schemeId}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.code === 200) {
        filterSchemes.value = filterSchemes.value.filter(s => s.id !== schemeId)
        return true
      }
      return false
    } catch (e) {
      console.error('[useViewManager] 删除视图失败', e)
      return false
    }
  }
  
  // 加载上次使用的视图
  async function loadLastUsedScheme(): Promise<FilterScheme | null> {
    try {
      const res = await fetch(`${apiBase}/user-preferences?key=${pageKey}-last-used-scheme`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (res.ok) {
        const json = await res.json()
        if (json.code === 200 && json.data) {
          const lastUsedSchemeId = json.data as string
          const scheme = filterSchemes.value.find(s => s.id === lastUsedSchemeId)
          return scheme || null
        }
      }
    } catch (e) {
      console.warn('[useViewManager] 加载上次视图失败', e)
    }
    return null
  }
  
  // 保存当前使用的视图
  async function saveLastUsedScheme(schemeId: string) {
    try {
      await fetch(`${apiBase}/user-preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: `${pageKey}-last-used-scheme`,
          value: schemeId,
        }),
      })
    } catch (e) {
      console.warn('[useViewManager] 保存当前视图失败', e)
    }
  }
  
  // 获取当前视图
  const currentScheme = computed(() => {
    if (!currentSchemeId.value || currentSchemeId.value === 'default') {
      return null
    }
    return filterSchemes.value.find(s => s.id === currentSchemeId.value) || null
  })
  
  // 获取视图下拉菜单文本
  function getDropdownButtonText() {
    if (!currentSchemeId.value || currentSchemeId.value === 'default') {
      return '默认视图'
    }
    const scheme = filterSchemes.value.find(s => s.id === currentSchemeId.value)
    return scheme ? scheme.name : '默认视图'
  }
  
  return {
    // 状态
    filterSchemes,
    filterOptions,
    currentSchemeId,
    dropdownOpen,
    
    // 计算属性
    currentScheme,
    
    // 方法
    loadSchemes,
    saveScheme,
    deleteScheme,
    loadLastUsedScheme,
    saveLastUsedScheme,
    getDropdownButtonText,
  }
}
