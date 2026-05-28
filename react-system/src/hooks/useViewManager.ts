import { useState, useCallback, useMemo } from 'react'

export interface FilterScheme {
  id: string
  name: string
  [key: string]: any
}

export interface FilterOption {
  key: string
  label: string
  [key: string]: any
}

export interface UseViewManagerOptions {
  pageKey: string
  apiBase?: string
}

export function useViewManager(options: UseViewManagerOptions) {
  const { pageKey, apiBase = '/api' } = options

  const [filterSchemes, setFilterSchemes] = useState<FilterScheme[]>([])
  const [filterOptions] = useState<FilterOption[]>([])
  const [currentSchemeId, setCurrentSchemeId] = useState<string>('default')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const loadSchemes = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/material-views`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const json = await res.json()
        if (json.code === 200) {
          setFilterSchemes(json.data || [])
        }
      }
    } catch {
      setFilterSchemes([])
    }
  }, [apiBase])

  const saveScheme = useCallback(
    async (scheme: FilterScheme): Promise<boolean> => {
      try {
        const res = await fetch(`${apiBase}/material-views`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scheme),
        })
        const json = await res.json()
        return json.code === 200
      } catch {
        return false
      }
    },
    [apiBase]
  )

  const deleteScheme = useCallback(
    async (schemeId: string): Promise<boolean> => {
      try {
        const res = await fetch(`${apiBase}/material-views/${schemeId}`, { method: 'DELETE' })
        const json = await res.json()
        if (json.code === 200) {
          setFilterSchemes((prev) => prev.filter((s) => s.id !== schemeId))
          return true
        }
        return false
      } catch {
        return false
      }
    },
    [apiBase]
  )

  const loadLastUsedScheme = useCallback(async (): Promise<FilterScheme | null> => {
    try {
      const res = await fetch(`${apiBase}/user-preferences?key=${pageKey}-last-used-scheme`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const json = await res.json()
        if (json.code === 200 && json.data) {
          return filterSchemes.find((s) => s.id === json.data) || null
        }
      }
    } catch {
      // ignore
    }
    return null
  }, [apiBase, pageKey, filterSchemes])

  const saveLastUsedScheme = useCallback(
    async (schemeId: string) => {
      try {
        await fetch(`${apiBase}/user-preferences`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: `${pageKey}-last-used-scheme`, value: schemeId }),
        })
      } catch {
        // ignore
      }
    },
    [apiBase, pageKey]
  )

  const currentScheme = useMemo(() => {
    if (!currentSchemeId || currentSchemeId === 'default') return null
    return filterSchemes.find((s) => s.id === currentSchemeId) || null
  }, [currentSchemeId, filterSchemes])

  const getDropdownButtonText = useCallback(() => {
    if (!currentSchemeId || currentSchemeId === 'default') return '默认视图'
    const scheme = filterSchemes.find((s) => s.id === currentSchemeId)
    return scheme ? scheme.name : '默认视图'
  }, [currentSchemeId, filterSchemes])

  return {
    filterSchemes,
    filterOptions,
    currentSchemeId,
    dropdownOpen,
    currentScheme,
    setCurrentSchemeId,
    setDropdownOpen,
    loadSchemes,
    saveScheme,
    deleteScheme,
    loadLastUsedScheme,
    saveLastUsedScheme,
    getDropdownButtonText,
  }
}
