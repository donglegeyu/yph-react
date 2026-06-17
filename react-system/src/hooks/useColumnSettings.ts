import { useState, useCallback, useRef } from 'react'

interface BaseColumnField {
  key: string
  label: string
  visible: boolean
  width?: number
  fixed?: 'left' | 'right'
}

export interface UseColumnSettingsOptions<T extends BaseColumnField = BaseColumnField> {
  pageKey: string
  apiEndpoint?: string
  storageType?: 'localStorage' | 'sessionStorage' | 'api'
  onLoad?: (fields: T[]) => void
  onSave?: (fields: T[]) => void
}

export function useColumnSettings<T extends BaseColumnField = BaseColumnField>(
  options: UseColumnSettingsOptions<T>
) {
  const { pageKey, apiEndpoint, storageType = 'localStorage', onLoad, onSave } = options

  const [columnFields, setColumnFields] = useState<T[]>([])
  const [defaultFields, setDefaultFieldsState] = useState<T[]>([])
  const [loading, setLoading] = useState(false)

  const storageKey = `column-settings-${pageKey}`

  function mergeFields(savedFields: T[]) {
    setColumnFields((prev) => {
      const next = [...prev]
      next.forEach((field) => {
        const saved = savedFields.find((f) => f.key === field.key)
        if (saved) {
          Object.assign(field, saved)
        }
      })
      return next
    })
  }

  function saveToLocal(): boolean {
    try {
      localStorage.setItem(storageKey, JSON.stringify(columnFields))
      if (onSave) onSave(columnFields)
      return true
    } catch {
      return false
    }
  }

  async function saveToApi(): Promise<boolean> {
    if (!apiEndpoint) return false
    setLoading(true)
    try {
      const res = await fetch(apiEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: storageKey,
          value: JSON.stringify(columnFields),
        }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.code === 200) {
          if (onSave) onSave(columnFields)
          return true
        }
      }
      return false
    } catch {
      return false
    } finally {
      setLoading(false)
    }
  }

  const saveToStorageRef = useRef(async (): Promise<boolean> => {
    if (storageType === 'api' && apiEndpoint) {
      return saveToApi()
    }
    return saveToLocal()
  })

  const saveToStorage = useCallback(async (): Promise<boolean> => {
    return saveToStorageRef.current()
  }, [])

  const loadFromStorage = useCallback(async (): Promise<T[]> => {
    try {
      if (storageType === 'api' && apiEndpoint) {
        setLoading(true)
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
                mergeFields(saved as T[])
                if (onLoad) onLoad(columnFields)
              }
            }
          }
          return columnFields
        } finally {
          setLoading(false)
        }
      } else {
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            if (Array.isArray(parsed) && parsed.length > 0) {
              mergeFields(parsed as T[])
              if (onLoad) onLoad(columnFields)
            }
          } catch {
            // ignore
          }
        }
        return columnFields
      }
    } catch {
      return columnFields
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageType, apiEndpoint, storageKey])

  const initFields = useCallback((fields: T[]) => {
    setDefaultFieldsState(JSON.parse(JSON.stringify(fields)))
    setColumnFields(JSON.parse(JSON.stringify(fields)))
  }, [])

  const updateFieldVisibility = useCallback((key: string, visible: boolean) => {
    setColumnFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, visible } : f))
    )
  }, [])

  const updateFieldWidth = useCallback((key: string, width: number) => {
    setColumnFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, width } : f))
    )
  }, [])

  const updateFieldFixed = useCallback((key: string, fixed?: 'left' | 'right') => {
    setColumnFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, fixed } : f))
    )
  }, [])

  const updateFieldOrder = useCallback((fromIndex: number, toIndex: number) => {
    setColumnFields((prev) => {
      const next = [...prev]
      const [removed] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, removed)
      return next
    })
  }, [])

  const getVisibleFields = useCallback((): T[] => {
    return columnFields.filter((f) => f.visible)
  }, [columnFields])

  const getHiddenFields = useCallback((): T[] => {
    return columnFields.filter((f) => !f.visible)
  }, [columnFields])

  const resetToDefault = useCallback(() => {
    setColumnFields(JSON.parse(JSON.stringify(defaultFields)))
    saveToStorage()
  }, [defaultFields, saveToStorage])

  const selectAll = useCallback(() => {
    setColumnFields((prev) => prev.map((f) => ({ ...f, visible: true })))
  }, [])

  const deselectAll = useCallback(() => {
    setColumnFields((prev) => prev.map((f) => ({ ...f, visible: false })))
  }, [])

  const confirmChanges = useCallback(
    (fields: T[]) => {
      setColumnFields(JSON.parse(JSON.stringify(fields)))
      saveToStorage()
    },
    [saveToStorage]
  )

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
  }
}
