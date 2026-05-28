import { ref } from 'vue'

export interface ColumnField {
  key: string
  label: string
  visible: boolean
  width?: number
  fixed?: 'left' | 'right'
  [key: string]: any
}

export interface UseColumnSettingsOptions {
  pageKey: string
  apiEndpoint?: string
  storageType?: 'localStorage' | 'sessionStorage' | 'api'
  onLoad?: (fields: ColumnField[]) => void
  onSave?: (fields: ColumnField[]) => void
}

export function useColumnSettings(options: UseColumnSettingsOptions) {
  const {
    pageKey,
    apiEndpoint,
    storageType = 'localStorage',
    onLoad,
    onSave,
  } = options

  const columnFields = ref<ColumnField[]>([])
  const defaultFields = ref<ColumnField[]>([])
  const loading = ref(false)

  const storageKey = `column-settings-${pageKey}`

  function initFields(fields: ColumnField[]) {
    defaultFields.value = JSON.parse(JSON.stringify(fields))
    columnFields.value = JSON.parse(JSON.stringify(fields))
  }

  function updateFieldVisibility(key: string, visible: boolean) {
    const field = columnFields.value.find(f => f.key === key)
    if (field) {
      field.visible = visible
    }
  }

  function updateFieldWidth(key: string, width: number) {
    const field = columnFields.value.find(f => f.key === key)
    if (field) {
      field.width = width
    }
  }

  function updateFieldFixed(key: string, fixed?: 'left' | 'right') {
    const field = columnFields.value.find(f => f.key === key)
    if (field) {
      field.fixed = fixed
    }
  }

  function updateFieldOrder(fromIndex: number, toIndex: number) {
    const field = columnFields.value.splice(fromIndex, 1)[0]
    columnFields.value.splice(toIndex, 0, field)
  }

  function getVisibleFields(): ColumnField[] {
    return columnFields.value.filter(f => f.visible)
  }

  function getHiddenFields(): ColumnField[] {
    return columnFields.value.filter(f => !f.visible)
  }

  function resetToDefault() {
    columnFields.value = JSON.parse(JSON.stringify(defaultFields.value))
    saveToStorage()
  }

  function selectAll() {
    columnFields.value.forEach(f => {
      f.visible = true
    })
  }

  function deselectAll() {
    columnFields.value.forEach(f => {
      f.visible = false
    })
  }

  async function loadFromStorage(): Promise<ColumnField[]> {
    try {
      if (storageType === 'api' && apiEndpoint) {
        return await loadFromApi()
      } else {
        return loadFromLocal()
      }
    } catch (e) {
      console.error('[useColumnSettings] 加载列设置失败', e)
      return []
    }
  }

  async function saveToStorage(): Promise<boolean> {
    try {
      if (storageType === 'api' && apiEndpoint) {
        return await saveToApi()
      } else {
        return saveToLocal()
      }
    } catch (e) {
      console.error('[useColumnSettings] 保存列设置失败', e)
      return false
    }
  }

  function loadFromLocal(): ColumnField[] {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          mergeFields(parsed)
          if (onLoad) {
            onLoad(columnFields.value)
          }
          return columnFields.value
        }
      } catch (e) {
        console.error('[useColumnSettings] 解析本地存储失败', e)
      }
    }
    return columnFields.value
  }

  function saveToLocal(): boolean {
    try {
      localStorage.setItem(storageKey, JSON.stringify(columnFields.value))
      if (onSave) {
        onSave(columnFields.value)
      }
      return true
    } catch (e) {
      console.error('[useColumnSettings] 保存到本地存储失败', e)
      return false
    }
  }

  async function loadFromApi(): Promise<ColumnField[]> {
    if (!apiEndpoint) {
      console.warn('[useColumnSettings] API endpoint 未设置')
      return columnFields.value
    }
    
    loading.value = true
    try {
      const res = await fetch(`${apiEndpoint}?key=${storageKey}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (res.ok) {
        const json = await res.json()
        if (json.code === 200 && json.data) {
          const saved = JSON.parse(json.data)
          if (Array.isArray(saved) && saved.length > 0) {
            mergeFields(saved)
            if (onLoad) {
              onLoad(columnFields.value)
            }
          }
        }
      }
      return columnFields.value
    } catch (e) {
      console.error('[useColumnSettings] 从 API 加载失败', e)
      return columnFields.value
    } finally {
      loading.value = false
    }
  }

  async function saveToApi(): Promise<boolean> {
    if (!apiEndpoint) {
      console.warn('[useColumnSettings] API endpoint 未设置')
      return false
    }
    
    loading.value = true
    try {
      const res = await fetch(apiEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: storageKey,
          value: JSON.stringify(columnFields.value),
        }),
      })
      
      if (res.ok) {
        const json = await res.json()
        if (json.code === 200) {
          if (onSave) {
            onSave(columnFields.value)
          }
          return true
        }
      }
      return false
    } catch (e) {
      console.error('[useColumnSettings] 保存到 API 失败', e)
      return false
    } finally {
      loading.value = false
    }
  }

  function mergeFields(savedFields: ColumnField[]) {
    savedFields.forEach(saved => {
      const existing = columnFields.value.find(f => f.key === saved.key)
      if (existing) {
        Object.assign(existing, saved)
      }
    })
  }

  function confirmChanges(fields: ColumnField[]) {
    columnFields.value = JSON.parse(JSON.stringify(fields))
    saveToStorage()
  }

  function cancelChanges() {
    // 不做任何修改，恢复原值
  }

  return {
    columnFields,
    defaultFields,
    loading,
    initFields,
    updateFieldVisibility,
    updateFieldWidth,
    updateFieldFixed,
    updateFieldOrder,
    getVisibleFields,
    getHiddenFields,
    resetToDefault,
    selectAll,
    deselectAll,
    loadFromStorage,
    saveToStorage,
    confirmChanges,
    cancelChanges,
  }
}
