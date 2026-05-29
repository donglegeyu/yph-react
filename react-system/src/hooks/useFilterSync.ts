/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useMemo } from 'react'
import type { FilterItem } from '@/types'

export interface FilterOption {
  key: string
  label: string
  checked?: boolean
  options?: { label: string; value: any }[]
  defaultValue?: any
  [key: string]: any
}

export interface FilterScheme {
  id: string
  name: string
  filters?: Record<string, any>
  filterOrder?: string[]
  userId?: string
  createdAt?: string
}

export interface UseFilterSyncOptions {
  defaultOptions?: FilterOption[]
  defaultItems?: FilterItem[]
}

export function useFilterSync(options: UseFilterSyncOptions = {}) {
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>(options.defaultOptions || [])
  const [dialogFilterOptions, setDialogFilterOptions] = useState<FilterOption[]>([])
  const [hasModified, setHasModified] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [filterItems] = useState<FilterItem[]>(options.defaultItems || [])

  const filteredFilterItems = useMemo(() => {
    return filterOptions
      .filter((opt) => opt.checked)
      .map((opt) => {
        const filterItem = filterItems.find((item) => item.key === opt.key)
        return filterItem ? { ...filterItem } : null
      })
      .filter((item): item is FilterItem => item !== null)
  }, [filterOptions, filterItems])

  const loadFromScheme = useCallback((scheme: FilterScheme) => {
    setFilterOptions((prev) => {
      const next = prev.map((opt) => ({ ...opt, checked: false, defaultValue: undefined }))
      if (scheme.filterOrder) {
        next.sort((a, b) => {
          const idxA = scheme.filterOrder!.indexOf(a.key)
          const idxB = scheme.filterOrder!.indexOf(b.key)
          if (idxA === -1) return 1
          if (idxB === -1) return -1
          return idxA - idxB
        })
        next.forEach((opt) => {
          if (scheme.filterOrder!.includes(opt.key)) {
            opt.checked = true
            opt.defaultValue = scheme.filters?.[opt.key]
          }
        })
      }
      return next
    })
    setHasModified(false)
  }, [])

  const syncToDialog = useCallback(() => {
    setDialogFilterOptions(
      filterOptions.map((opt) => ({
        key: opt.key,
        label: opt.label,
        checked: opt.checked,
        options: opt.options ? [...opt.options] : undefined,
        defaultValue: opt.defaultValue,
      }))
    )
  }, [filterOptions])

  const syncFromDialog = useCallback(() => {
    setFilterOptions(
      dialogFilterOptions.map((opt) => ({
        key: opt.key,
        label: opt.label,
        checked: opt.checked,
        options: opt.options ? [...opt.options] : undefined,
        defaultValue: opt.defaultValue,
      }))
    )
    setHasModified(true)
  }, [dialogFilterOptions])

  const resetToDefault = useCallback(() => {
    setFilterOptions((prev) =>
      prev.map((opt) => ({ ...opt, checked: true, defaultValue: undefined }))
    )
    setHasModified(false)
  }, [])

  const openDrawer = useCallback(() => {
    syncToDialog()
  }, [syncToDialog])

  const handleDrop = useCallback((targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return
    setDialogFilterOptions((prev) => {
      const next = [...prev]
      const [removed] = next.splice(dragIndex!, 1)
      next.splice(targetIndex, 0, removed)
      return next
    })
    setDragIndex(null)
    setHasModified(true)
  }, [dragIndex])

  const updateDialogChecked = useCallback((index: number, checked: boolean) => {
    setDialogFilterOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, checked } : opt))
    )
    setHasModified(true)
  }, [])

  const updateDialogDefaultValue = useCallback((index: number, value: unknown) => {
    setDialogFilterOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, defaultValue: value } : opt))
    )
    setHasModified(true)
  }, [])

  const getSchemeData = useCallback(
    (name: string, existingId?: string): FilterScheme => {
      const selectedFilters: Record<string, unknown> = {}
      const filterOrder: string[] = []
      dialogFilterOptions.forEach((opt) => {
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
      }
    },
    [dialogFilterOptions]
  )

  return {
    filterOptions,
    dialogFilterOptions,
    hasModified,
    dragIndex,
    filterItems,
    filteredFilterItems,
    loadFromScheme,
    syncToDialog,
    syncFromDialog,
    resetToDefault,
    openDrawer,
    handleDragStart: (index: number) => setDragIndex(index),
    handleDragEnd: () => setDragIndex(null),
    handleDrop,
    updateDialogChecked,
    updateDialogDefaultValue,
    getSchemeData,
  }
}
