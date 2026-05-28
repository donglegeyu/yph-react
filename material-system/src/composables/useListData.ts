import { ref, computed } from 'vue'

export interface PaginationConfig {
  current: number
  pageSize: number
  total: number
}

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
    autoFetch = false,
    transformResponse,
    onSuccess,
    onError,
  } = options

  const loading = ref(false)
  const dataSource = ref<T[]>([]) as any
  const pagination = ref<PaginationConfig>({
    current: 1,
    pageSize: defaultPageSize,
    total: 0,
  })
  const filterParams = ref<Record<string, any>>({})
  const error = ref<Error | null>(null)

  const hasData = computed(() => dataSource.value.length > 0)
  const isEmpty = computed(() => !loading.value && dataSource.value.length === 0)
  const hasFilters = computed(() => Object.keys(filterParams.value).length > 0)

  function buildQueryString(params?: Record<string, any>): string {
    const queryParams = new URLSearchParams()
    
    queryParams.append('current', String(pagination.value.current))
    queryParams.append('size', String(pagination.value.pageSize))
    
    const filters = params || filterParams.value
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          value.forEach(v => queryParams.append(key, String(v)))
        } else if (!Array.isArray(value)) {
          queryParams.append(key, String(value))
        }
      }
    })
    
    return queryParams.toString()
  }

  async function fetchData(params?: Record<string, any>): Promise<T[]> {
    loading.value = true
    error.value = null
    
    try {
      const queryString = buildQueryString(params)
      const url = queryString ? `${apiEndpoint}?${queryString}` : apiEndpoint
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const json = await res.json()
      
      if (json.code !== 200) {
        throw new Error(json.message || '请求失败')
      }
      
      let records: T[] = []
      
      if (json.data) {
        if (Array.isArray(json.data)) {
          records = transformResponse ? transformResponse(json.data) : json.data
        } else if (json.data.records) {
          records = transformResponse ? transformResponse(json.data.records) : json.data.records
          if (json.data.total !== undefined) {
            pagination.value.total = json.data.total
          }
        } else {
          records = transformResponse ? transformResponse(json.data) : [json.data]
        }
      }
      
      dataSource.value = records
      
      if (json.total !== undefined) {
        pagination.value.total = json.total
      } else if (json.data?.records && json.data.total !== undefined) {
        pagination.value.total = json.data.total
      } else if (pagination.value.total === 0) {
        pagination.value.total = records.length
      }
      
      if (onSuccess) {
        onSuccess(records)
      }
      
      return records
    } catch (e) {
      error.value = e as Error
      if (onError) {
        onError(error.value)
      }
      console.error('[useListData] 获取数据失败', e)
      return []
    } finally {
      loading.value = false
    }
  }

  async function refresh(): Promise<T[]> {
    pagination.value.current = 1
    return fetchData()
  }

  async function loadMore(): Promise<T[]> {
    if (pagination.value.current * pagination.value.pageSize >= pagination.value.total) {
      return dataSource.value
    }
    
    pagination.value.current += 1
    return fetchData()
  }

  function setFilterParams(params: Record<string, any>) {
    filterParams.value = { ...params }
  }

  function updateFilterParam(key: string, value: any) {
    filterParams.value[key] = value
  }

  function removeFilterParam(key: string) {
    delete filterParams.value[key]
  }

  function clearFilterParams() {
    filterParams.value = {}
  }

  function setPagination(config: Partial<PaginationConfig>) {
    pagination.value = { ...pagination.value, ...config }
  }

  function resetPagination() {
    pagination.value = {
      current: 1,
      pageSize: defaultPageSize,
      total: 0,
    }
  }

  function handlePageChange(page: number, pageSize?: number) {
    if (pageSize && pageSize !== pagination.value.pageSize) {
      pagination.value.pageSize = pageSize
    }
    pagination.value.current = page
    fetchData()
  }

  function handlePageSizeChange(pageSize: number) {
    pagination.value.pageSize = pageSize
    pagination.value.current = 1
    fetchData()
  }

  function getSelectedRows(keys: (string | number)[]): T[] {
    return dataSource.value.filter((row: any) => keys.includes(row.id))
  }

  function getRowById(id: string | number): T | undefined {
    return dataSource.value.find((row: any) => row.id === id)
  }

  function updateRow(id: string | number, updates: Partial<T>) {
    const index = dataSource.value.findIndex((row: any) => row.id === id)
    if (index !== -1) {
      dataSource.value[index] = { ...dataSource.value[index], ...updates }
    }
  }

  function removeRow(id: string | number) {
    dataSource.value = dataSource.value.filter((row: any) => row.id !== id)
    pagination.value.total = Math.max(0, pagination.value.total - 1)
  }

  function addRow(row: T) {
    dataSource.value.unshift(row)
    pagination.value.total += 1
  }

  function clearData() {
    dataSource.value = []
    pagination.value.total = 0
  }

  if (autoFetch) {
    fetchData()
  }

  return {
    loading,
    dataSource,
    pagination,
    filterParams,
    error,
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
