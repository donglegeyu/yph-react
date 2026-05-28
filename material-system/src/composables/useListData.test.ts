import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useListData } from './useListData'

// Mock fetch
global.fetch = vi.fn()

const mockFetch = global.fetch as jest.Mock

describe('useListData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('初始化', () => {
    it('应该返回一个对象', () => {
      const result = useListData({ apiEndpoint: '/api/test' })
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('应该包含必要的方法和属性', () => {
      const {
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
        setFilterParams,
        updateFilterParam,
        removeFilterParam,
        clearFilterParams,
        setPagination,
        resetPagination,
      } = useListData({ apiEndpoint: '/api/test' })

      expect(loading.value).toBe(false)
      expect(Array.isArray(dataSource.value)).toBe(true)
      expect(pagination.value).toEqual({
        current: 1,
        pageSize: 20,
        total: 0,
      })
      expect(typeof fetchData).toBe('function')
      expect(typeof refresh).toBe('function')
      expect(typeof setFilterParams).toBe('function')
    })

    it('应该使用默认分页大小', () => {
      const { pagination } = useListData({ apiEndpoint: '/api/test' })
      expect(pagination.value.pageSize).toBe(20)
    })

    it('应该支持自定义分页大小', () => {
      const { pagination } = useListData({ apiEndpoint: '/api/test', defaultPageSize: 50 })
      expect(pagination.value.pageSize).toBe(50)
    })
  })

  describe('fetchData', () => {
    it('应该获取数据成功', async () => {
      const mockData = {
        code: 200,
        data: {
          records: [
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' },
          ],
          total: 2,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      const { loading, dataSource, pagination, fetchData } = useListData({
        apiEndpoint: '/api/test',
      })

      await fetchData()

      expect(dataSource.value).toHaveLength(2)
      expect(pagination.value.total).toBe(2)
      expect(loading.value).toBe(false)
    })

    it('应该在加载时设置 loading 为 true', async () => {
      mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ code: 200, data: { records: [] } }),
      }), 100)))

      const { loading, fetchData } = useListData({ apiEndpoint: '/api/test' })

      const fetchPromise = fetchData()
      expect(loading.value).toBe(true)

      await fetchPromise
      expect(loading.value).toBe(false)
    })

    it('应该在请求失败时设置错误', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const { error, fetchData } = useListData({ apiEndpoint: '/api/test' })

      await fetchData()

      expect(error.value).toBeDefined()
    })
  })

  describe('filterParams', () => {
    it('应该设置筛选参数', () => {
      const { filterParams, setFilterParams } = useListData({ apiEndpoint: '/api/test' })

      setFilterParams({ name: 'test', status: 'active' })

      expect(filterParams.value).toEqual({ name: 'test', status: 'active' })
    })

    it('应该更新单个筛选参数', () => {
      const { filterParams, updateFilterParam } = useListData({ apiEndpoint: '/api/test' })

      updateFilterParam('name', 'test')
      expect(filterParams.value.name).toBe('test')

      updateFilterParam('name', 'new-test')
      expect(filterParams.value.name).toBe('new-test')
    })

    it('应该移除筛选参数', () => {
      const { filterParams, setFilterParams, removeFilterParam } = useListData({
        apiEndpoint: '/api/test',
      })

      setFilterParams({ name: 'test', status: 'active' })
      removeFilterParam('name')

      expect(filterParams.value.name).toBeUndefined()
      expect(filterParams.value.status).toBe('active')
    })

    it('应该清空所有筛选参数', () => {
      const { filterParams, setFilterParams, clearFilterParams } = useListData({
        apiEndpoint: '/api/test',
      })

      setFilterParams({ name: 'test', status: 'active' })
      clearFilterParams()

      expect(filterParams.value).toEqual({})
    })
  })

  describe('pagination', () => {
    it('应该设置分页配置', () => {
      const { pagination, setPagination } = useListData({ apiEndpoint: '/api/test' })

      setPagination({ current: 2, pageSize: 50 })

      expect(pagination.value.current).toBe(2)
      expect(pagination.value.pageSize).toBe(50)
    })

    it('应该重置分页配置', () => {
      const { pagination, setPagination, resetPagination } = useListData({
        apiEndpoint: '/api/test',
      })

      setPagination({ current: 5, pageSize: 100 })
      resetPagination()

      expect(pagination.value).toEqual({
        current: 1,
        pageSize: 20,
        total: 0,
      })
    })
  })

  describe('计算属性', () => {
    it('hasData 应该正确反映数据是否存在', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 200,
          data: { records: [{ id: 1 }] },
        }),
      })

      const { hasData, fetchData } = useListData({ apiEndpoint: '/api/test' })

      expect(hasData.value).toBe(false)
      await fetchData()
      expect(hasData.value).toBe(true)
    })

    it('isEmpty 应该正确反映是否为空', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 200,
          data: { records: [] },
        }),
      })

      const { isEmpty, fetchData } = useListData({ apiEndpoint: '/api/test' })

      await fetchData()
      expect(isEmpty.value).toBe(true)
    })

    it('hasFilters 应该正确反映是否有筛选条件', () => {
      const { hasFilters, setFilterParams } = useListData({ apiEndpoint: '/api/test' })

      expect(hasFilters.value).toBe(false)

      setFilterParams({ name: 'test' })
      expect(hasFilters.value).toBe(true)
    })
  })

  describe('refresh', () => {
    it('应该重置到第一页并获取数据', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 200,
          data: { records: [] },
        }),
      })

      const { pagination, refresh, setPagination } = useListData({ apiEndpoint: '/api/test' })

      setPagination({ current: 5 })
      await refresh()

      expect(pagination.value.current).toBe(1)
      expect(mockFetch).toHaveBeenCalled()
    })
  })

  describe('数据操作', () => {
    it('getRowById 应该返回正确的行', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 200,
          data: {
            records: [
              { id: 1, name: 'Item 1' },
              { id: 2, name: 'Item 2' },
            ],
          },
        }),
      })

      const { getRowById, fetchData } = useListData({ apiEndpoint: '/api/test' })

      await fetchData()

      const row = getRowById(1)
      expect(row).toEqual({ id: 1, name: 'Item 1' })

      const notFound = getRowById(999)
      expect(notFound).toBeUndefined()
    })

    it('updateRow 应该更新行数据', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 200,
          data: {
            records: [{ id: 1, name: 'Item 1' }],
          },
        }),
      })

      const { updateRow, fetchData, dataSource } = useListData({ apiEndpoint: '/api/test' })

      await fetchData()
      updateRow(1, { name: 'Updated Item' })

      expect(dataSource.value.find(item => item.id === 1)?.name).toBe('Updated Item')
    })

    it('removeRow 应该删除行数据', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 200,
          data: {
            records: [
              { id: 1, name: 'Item 1' },
              { id: 2, name: 'Item 2' },
            ],
            total: 2,
          },
        }),
      })

      const { removeRow, fetchData, dataSource } = useListData({ apiEndpoint: '/api/test' })

      await fetchData()
      removeRow(1)

      expect(dataSource.value).toHaveLength(1)
      expect(dataSource.value[0].id).toBe(2)
    })

    it('addRow 应该添加新行', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 200,
          data: {
            records: [{ id: 1, name: 'Item 1' }],
          },
        }),
      })

      const { addRow, fetchData, dataSource } = useListData({ apiEndpoint: '/api/test' })

      await fetchData()
      addRow({ id: 2, name: 'Item 2' })

      expect(dataSource.value).toHaveLength(2)
      expect(dataSource.value[0].id).toBe(2) // 新添加的在前面
    })

    it('clearData 应该清空数据', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 200,
          data: {
            records: [{ id: 1, name: 'Item 1' }],
          },
        }),
      })

      const { clearData, fetchData, dataSource } = useListData({ apiEndpoint: '/api/test' })

      await fetchData()
      expect(dataSource.value).toHaveLength(1)

      clearData()
      expect(dataSource.value).toHaveLength(0)
    })
  })

  describe('错误处理', () => {
    it('应该调用 onError 回调', async () => {
      const onError = vi.fn()

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const { fetchData } = useListData({ apiEndpoint: '/api/test', onError })

      await fetchData()

      expect(onError).toHaveBeenCalled()
    })

    it('应该在网络错误时设置错误', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network Error'))

      const { error, fetchData } = useListData({ apiEndpoint: '/api/test' })

      await fetchData()

      expect(error.value).toBeDefined()
      expect(error.value?.message).toBe('Network Error')
    })
  })
})
