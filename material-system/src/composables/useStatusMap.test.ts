import { describe, it, expect, beforeEach } from 'vitest'
import { useStatusMap } from './useStatusMap'

describe('useStatusMap', () => {
  describe('初始化', () => {
    it('应该返回一个对象', () => {
      const result = useStatusMap()
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('应该包含必要的方法', () => {
      const {
        registerStatusMap,
        addStatus,
        getStatusText,
        getStatusColor,
        getStatusConfig,
        hasStatus,
        getAllStatuses,
        clearStatusMap,
      } = useStatusMap()

      expect(typeof registerStatusMap).toBe('function')
      expect(typeof addStatus).toBe('function')
      expect(typeof getStatusText).toBe('function')
      expect(typeof getStatusColor).toBe('function')
      expect(typeof getStatusConfig).toBe('function')
      expect(typeof hasStatus).toBe('function')
      expect(typeof getAllStatuses).toBe('function')
      expect(typeof clearStatusMap).toBe('function')
    })
  })

  describe('registerStatusMap', () => {
    it('应该注册状态映射', () => {
      const { registerStatusMap, getStatusText } = useStatusMap()

      registerStatusMap({
        draft: { text: '草稿', color: 'default' },
        approved: { text: '已通过', color: 'success' },
      })

      expect(getStatusText('draft')).toBe('草稿')
      expect(getStatusText('approved')).toBe('已通过')
    })

    it('应该支持初始状态映射', () => {
      const { getStatusText } = useStatusMap({
        defaultStatusMap: {
          pending: { text: '待处理', color: 'warning' },
        },
      })

      expect(getStatusText('pending')).toBe('待处理')
    })
  })

  describe('addStatus', () => {
    it('应该添加单个状态', () => {
      const { addStatus, getStatusText } = useStatusMap()

      addStatus('active', { text: '激活', color: 'success' })
      expect(getStatusText('active')).toBe('激活')
    })
  })

  describe('getStatusText', () => {
    it('应该返回正确的状态文本', () => {
      const { registerStatusMap, getStatusText } = useStatusMap()

      registerStatusMap({
        draft: { text: '草稿', color: 'default' },
        pending: { text: '审核中', color: 'warning' },
        approved: { text: '已通过', color: 'success' },
        rejected: { text: '已拒绝', color: 'error' },
      })

      expect(getStatusText('draft')).toBe('草稿')
      expect(getStatusText('pending')).toBe('审核中')
      expect(getStatusText('approved')).toBe('已通过')
      expect(getStatusText('rejected')).toBe('已拒绝')
    })

    it('对于未注册的状态应该返回原始值', () => {
      const { registerStatusMap, getStatusText } = useStatusMap()

      registerStatusMap({
        draft: { text: '草稿', color: 'default' },
      })

      expect(getStatusText('unknown')).toBe('unknown')
      expect(getStatusText('other')).toBe('other')
    })

    it('对于空值应该返回空字符串', () => {
      const { registerStatusMap, getStatusText } = useStatusMap()

      registerStatusMap({
        draft: { text: '草稿', color: 'default' },
      })

      expect(getStatusText('')).toBe('')
      expect(getStatusText(undefined as any)).toBe('')
    })
  })

  describe('getStatusColor', () => {
    it('应该返回正确的状态颜色', () => {
      const { registerStatusMap, getStatusColor } = useStatusMap()

      registerStatusMap({
        draft: { text: '草稿', color: 'default' },
        approved: { text: '已通过', color: 'success' },
        rejected: { text: '已拒绝', color: 'error' },
      })

      expect(getStatusColor('draft')).toBe('default')
      expect(getStatusColor('approved')).toBe('success')
      expect(getStatusColor('rejected')).toBe('error')
    })

    it('对于未注册的状态应该返回默认值', () => {
      const { registerStatusMap, getStatusColor } = useStatusMap()

      registerStatusMap({
        draft: { text: '草稿', color: 'default' },
      })

      expect(getStatusColor('unknown')).toBe('default')
    })
  })

  describe('getStatusConfig', () => {
    it('应该返回完整的状态配置', () => {
      const { registerStatusMap, getStatusConfig } = useStatusMap()

      registerStatusMap({
        approved: { text: '已通过', color: 'success' },
      })

      const config = getStatusConfig('approved')
      expect(config).toEqual({ text: '已通过', color: 'success' })
    })

    it('对于未注册的状态应该返回 undefined', () => {
      const { registerStatusMap, getStatusConfig } = useStatusMap()

      registerStatusMap({
        draft: { text: '草稿', color: 'default' },
      })

      expect(getStatusConfig('unknown')).toBeUndefined()
    })
  })

  describe('hasStatus', () => {
    it('应该正确判断状态是否存在', () => {
      const { registerStatusMap, hasStatus } = useStatusMap()

      registerStatusMap({
        draft: { text: '草稿', color: 'default' },
        approved: { text: '已通过', color: 'success' },
      })

      expect(hasStatus('draft')).toBe(true)
      expect(hasStatus('approved')).toBe(true)
      expect(hasStatus('rejected')).toBe(false)
      expect(hasStatus('unknown')).toBe(false)
    })
  })

  describe('getAllStatuses', () => {
    it('应该返回所有状态的数组', () => {
      const { registerStatusMap, getAllStatuses } = useStatusMap()

      registerStatusMap({
        draft: { text: '草稿', color: 'default' },
        approved: { text: '已通过', color: 'success' },
      })

      const statuses = getAllStatuses()
      expect(statuses).toHaveLength(2)
      expect(statuses[0]).toEqual({ key: 'draft', config: { text: '草稿', color: 'default' } })
      expect(statuses[1]).toEqual({ key: 'approved', config: { text: '已通过', color: 'success' } })
    })

    it('对于空状态映射应该返回空数组', () => {
      const { getAllStatuses } = useStatusMap()

      const statuses = getAllStatuses()
      expect(statuses).toEqual([])
    })
  })

  describe('clearStatusMap', () => {
    it('应该清空所有状态', () => {
      const { registerStatusMap, getStatusText, hasStatus, clearStatusMap } = useStatusMap()

      registerStatusMap({
        draft: { text: '草稿', color: 'default' },
      })

      expect(getStatusText('draft')).toBe('草稿')
      expect(hasStatus('draft')).toBe(true)

      clearStatusMap()

      expect(getStatusText('draft')).toBe('draft')
      expect(hasStatus('draft')).toBe(false)
    })
  })

  describe('多个实例隔离', () => {
    it('每个实例应该独立', () => {
      const instance1 = useStatusMap()
      const instance2 = useStatusMap()

      instance1.registerStatusMap({
        draft: { text: '草稿1', color: 'red' },
      })

      instance2.registerStatusMap({
        draft: { text: '草稿2', color: 'blue' },
      })

      expect(instance1.getStatusText('draft')).toBe('草稿1')
      expect(instance2.getStatusText('draft')).toBe('草稿2')
    })
  })
})
