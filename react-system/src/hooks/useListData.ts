import { useState, useCallback, useMemo } from 'react'
import type { PaginationConfig } from '@/types'

export interface UseListDataOptions<T = any> {
  apiEndpoint: string
  defaultPageSize?: number
  autoFetch?: boolean
  transformResponse?: (data: any) => T[]
  onSuccess?: (data: T[]) => void
  onError?: (error: Error) => void
}

export function useListData<T = any>(options: UseListDataOptions<T>) {
  const {
    apiEndpoint,
    defaultPageSize = 20,
    transformResponse,
    onSuccess,
    onError,
  } = options

  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<T[]>([])
  const [pagination, setPaginationState] = useState<PaginationConfig>({
    current: 1,
    pageSize: defaultPageSize,
    total: 0,
  })
  const [filterParams, setFilterParamsState] = useState<Record<string, any>>({})

  const hasData = useMemo(() => dataSource.length > 0, [dataSource])
  const isEmpty = useMemo(() => !loading && dataSource.length === 0, [loading, dataSource])
  const hasFilters = useMemo(() => Object.keys(filterParams).length > 0, [filterParams])

  function buildQueryString(params?: Record<string, any>): string {
    const queryParams = new URLSearchParams()
    queryParams.append('current', String(pagination.current))
    queryParams.append('size', String(pagination.pageSize))
    const filters = params || filterParams
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          value.forEach((v) => queryParams.append(key, String(v)))
        } else if (!Array.isArray(value)) {
          queryParams.append(key, String(value))
        }
      }
    })
    return queryParams.toString()
  }

  const fetchData = useCallback(async (params?: Record<string, any>): Promise<T[]> => {
    setLoading(true)
    try {
      const queryString = buildQueryString(params)
      const url = queryString ? `${apiEndpoint}?${queryString}` : apiEndpoint
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const json = await res.json()
      if (json.code !== 200) throw new Error(json.message || '请求失败')

      let records: T[] = []
      if (json.data) {
        if (Array.isArray(json.data)) {
          records = transformResponse ? transformResponse(json.data) : json.data
        } else if (json.data.records) {
          records = transformResponse ? transformResponse(json.data.records) : json.data.records
          if (json.data.total !== undefined) {
            setPaginationState((prev) => ({ ...prev, total: json.data.total }))
          }
        } else {
          records = transformResponse ? transformResponse(json.data) : [json.data]
        }
      }
      setDataSource(records)
      if (json.total !== undefined) {
        setPaginationState((prev) => ({ ...prev, total: json.total }))
      } else if (json.data?.records && json.data.total !== undefined) {
        setPaginationState((prev) => ({ ...prev, total: json.data.total }))
      } else if (pagination.total === 0) {
        setPaginationState((prev) => ({ ...prev, total: records.length }))
      }
      if (onSuccess) onSuccess(records)
      return records
    } catch (e) {
      const err = e as Error
      if (onError) onError(err)
      console.error('[useListData] 获取数据失败', e)
      return []
    } finally {
      setLoading(false)
    }
  }, [apiEndpoint, filterParams, pagination.current, pagination.pageSize, pagination.total, transformResponse, onSuccess, onError])

  const refresh = useCallback(async (): Promise<T[]> => {
    setPaginationState((prev) => ({ ...prev, current: 1 }))
    return fetchData()
  }, [fetchData])

  const loadMore = useCallback(async (): Promise<T[]> => {
    if (pagination.current * pagination.pageSize >= pagination.total) {
      return dataSource
    }
    setPaginationState((prev) => ({ ...prev, current: prev.current + 1 }))
    return fetchData()
  }, [fetchData, pagination, dataSource])

  const setFilterParams = useCallback((params: Record<string, any>) => {
    setFilterParamsState(params)
  }, [])

  const updateFilterParam = useCallback((key: string, value: any) => {
    setFilterParamsState((prev) => ({ ...prev, [key]: value }))
  }, [])

  const removeFilterParam = useCallback((key: string) => {
    setFilterParamsState((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const clearFilterParams = useCallback(() => {
    setFilterParamsState({})
  }, [])

  const setPagination = useCallback((config: Partial<PaginationConfig>) => {
    setPaginationState((prev) => ({ ...prev, ...config }))
  }, [])

  const resetPagination = useCallback(() => {
    setPaginationState({ current: 1, pageSize: defaultPageSize, total: 0 })
  }, [defaultPageSize])

  const handlePageChange = useCallback((page: number, pageSize?: number) => {
    setPaginationState((prev) => {
      const next = { ...prev, current: page }
      if (pageSize) next.pageSize = pageSize
      return next
    })
    fetchData()
  }, [fetchData])

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setPaginationState((prev) => ({ ...prev, pageSize, current: 1 }))
    fetchData()
  }, [fetchData])

  const getSelectedRows = useCallback((keys: (string | number)[]): T[] => {
    return dataSource.filter((row: any) => keys.includes(row.id))
  }, [dataSource])

  const getRowById = useCallback((id: string | number): T | undefined => {
    return dataSource.find((row: any) => row.id === id)
  }, [dataSource])

  const updateRow = useCallback((id: string | number, updates: Partial<T>) => {
    setDataSource((prev) =>
      prev.map((row: any) => (row.id === id ? { ...row, ...updates } : row))
    )
  }, [])

  const removeRow = useCallback((id: string | number) => {
    setDataSource((prev) => prev.filter((row: any) => row.id !== id))
    setPaginationState((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }))
  }, [])

  const addRow = useCallback((row: T) => {
    setDataSource((prev) => [row, ...prev])
    setPaginationState((prev) => ({ ...prev, total: prev.total + 1 }))
  }, [])

  const clearData = useCallback(() => {
    setDataSource([])
    setPaginationState((prev) => ({ ...prev, total: 0 }))
  }, [])

  return {
    loading,
    dataSource,
    pagination,
    filterParams,
    hasData,
    isEmpty,
    hasFilters,
    fetchData,
    refresh,
    loadMore,
    setFilterParams,
    updateFilterParam,
    removeFilterParam,
    clearFilterParams,
    setPagination,
    resetPagination,
    handlePageChange,
    handlePageSizeChange,
    getSelectedRows,
    getRowById,
    updateRow,
    removeRow,
    addRow,
    clearData,
  }
}
