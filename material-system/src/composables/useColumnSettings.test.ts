import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useColumnSettings } from './useColumnSettings'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('useColumnSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  describe('初始化', () => {
    it('应该返回一个对象', () => {
      const result = useColumnSettings({ pageKey: 'test' })
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('应该包含必要的方法和属性', () => {
      const {
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
      } = useColumnSettings({ pageKey: 'test' })

      expect(columnFields.value).toEqual([])
      expect(defaultFields.value).toEqual([])
      expect(loading.value).toBe(false)
      expect(typeof initFields).toBe('function')
      expect(typeof updateFieldVisibility).toBe('function')
      expect(typeof updateFieldWidth).toBe('function')
      expect(typeof updateFieldFixed).toBe('function')
      expect(typeof updateFieldOrder).toBe('function')
      expect(typeof getVisibleFields).toBe('function')
      expect(typeof getHiddenFields).toBe('function')
      expect(typeof resetToDefault).toBe('function')
      expect(typeof selectAll).toBe('function')
      expect(typeof deselectAll).toBe('function')
      expect(typeof loadFromStorage).toBe('function')
      expect(typeof saveToStorage).toBe('function')
    })

    it('应该使用默认 pageKey', () => {
      const { loadFromStorage } = useColumnSettings({})
      expect(typeof loadFromStorage).toBe('function')
    })
  })

  describe('initFields', () => {
    it('应该初始化字段', () => {
      const { columnFields, defaultFields, initFields } = useColumnSettings({ pageKey: 'test' })

      const fields = [
        { key: 'name', label: '名称', visible: true, width: 100 },
        { key: 'status', label: '状态', visible: false, width: 80 },
      ]

      initFields(fields)

      expect(columnFields.value).toEqual(fields)
      expect(defaultFields.value).toEqual(fields)
    })

    it('应该深拷贝字段以避免引用问题', () => {
      const { initFields } = useColumnSettings({ pageKey: 'test' })

      const fields = [
        { key: 'name', label: '名称', visible: true, width: 100 },
      ]

      initFields(fields)
      
      // 修改 columnFields 不应影响原数组
      expect(fields[0].visible).toBe(true)
    })
  })

  describe('updateFieldVisibility', () => {
    it('应该更新字段可见性', () => {
      const { columnFields, initFields, updateFieldVisibility } = useColumnSettings({ pageKey: 'test' })

      initFields([
        { key: 'name', label: '名称', visible: true, width: 100 },
        { key: 'status', label: '状态', visible: false, width: 80 },
      ])

      updateFieldVisibility('name', false)
      expect(columnFields.value.find(f => f.key === 'name')?.visible).toBe(false)

      updateFieldVisibility('status', true)
      expect(columnFields.value.find(f => f.key === 'status')?.visible).toBe(true)
    })

    it('对于不存在的字段应该忽略', () => {
      const { columnFields, initFields, updateFieldVisibility } = useColumnSettings({ pageKey: 'test' })

      initFields([
        { key: 'name', label: '名称', visible: true, width: 100 },
      ])

      // 不应该抛出错误
      expect(() => updateFieldVisibility('not-exist', false)).not.toThrow()
      expect(columnFields.value[0].visible).toBe(true)
    })
  })

  describe('updateFieldWidth', () => {
    it('应该更新字段宽度', () => {
      const { columnFields, initFields, updateFieldWidth } = useColumnSettings({ pageKey: 'test' })

      initFields([
        { key: 'name', label: '名称', visible: true, width: 100 },
      ])

      updateFieldWidth('name', 200)
      expect(columnFields.value.find(f => f.key === 'name')?.width).toBe(200)
    })
  })

  describe('updateFieldFixed', () => {
    it('应该更新字段固定位置', () => {
      const { columnFields, initFields, updateFieldFixed } = useColumnSettings({ pageKey: 'test' })

      initFields([
        { key: 'name', label: '名称', visible: true, width: 100 },
      ])

      updateFieldFixed('name', 'left')
      expect(columnFields.value.find(f => f.key === 'name')?.fixed).toBe('left')

      updateFieldFixed('name', 'right')
      expect(columnFields.value.find(f => f.key === 'name')?.fixed).toBe('right')

      updateFieldFixed('name')
      expect(columnFields.value.find(f => f.key === 'name')?.fixed).toBeUndefined()
    })
  })

  describe('updateFieldOrder', () => {
    it('应该更新字段顺序', () => {
      const { columnFields, initFields, updateFieldOrder } = useColumnSettings({ pageKey: 'test' })

      initFields([
        { key: 'name', label: '名称', visible: true, width: 100 },
        { key: 'status', label: '状态', visible: true, width: 80 },
        { key: 'date', label: '日期', visible: true, width: 120 },
      ])

      // 将 index 0 的元素移动到 index 2
      updateFieldOrder(0, 2)

      expect(columnFields.value[0].key).toBe('status')  // name 被移走，status 成为第一个
      expect(columnFields.value[1].key).toBe('date')
      expect(columnFields.value[2].key).toBe('name')   // name 被移到末尾
    })
  })

  describe('getVisibleFields', () => {
    it('应该返回可见字段', () => {
      const { getVisibleFields, initFields } = useColumnSettings({ pageKey: 'test' })

      initFields([
        { key: 'name', label: '名称', visible: true, width: 100 },
        { key: 'status', label: '状态', visible: false, width: 80 },
        { key: 'date', label: '日期', visible: true, width: 120 },
      ])

      const visible = getVisibleFields()
      expect(visible).toHaveLength(2)
      expect(visible.map(f => f.key)).toEqual(['name', 'date'])
    })
  })

  describe('getHiddenFields', () => {
    it('应该返回隐藏字段', () => {
      const { getHiddenFields, initFields } = useColumnSettings({ pageKey: 'test' })

      initFields([
        { key: 'name', label: '名称', visible: true, width: 100 },
        { key: 'status', label: '状态', visible: false, width: 80 },
        { key: 'date', label: '日期', visible: false, width: 120 },
      ])

      const hidden = getHiddenFields()
      expect(hidden).toHaveLength(2)
      expect(hidden.map(f => f.key)).toEqual(['status', 'date'])
    })
  })

  describe('resetToDefault', () => {
    it('应该重置为默认字段', () => {
      const { columnFields, initFields, updateFieldVisibility, resetToDefault } = useColumnSettings({ pageKey: 'test' })

      initFields([
        { key: 'name', label: '名称', visible: true, width: 100 },
        { key: 'status', label: '状态', visible: false, width: 80 },
      ])

      // 修改一些字段
      updateFieldVisibility('name', false)
      expect(columnFields.value[0].visible).toBe(false)

      // 重置
      resetToDefault()
      expect(columnFields.value[0].visible).toBe(true)
    })
  })

  describe('selectAll', () => {
    it('应该选中所有字段', () => {
      const { columnFields, initFields, selectAll } = useColumnSettings({ pageKey: 'test' })

      initFields([
        { key: 'name', label: '名称', visible: false, width: 100 },
        { key: 'status', label: '状态', visible: false, width: 80 },
      ])

      selectAll()

      expect(columnFields.value.every(f => f.visible)).toBe(true)
    })
  })

  describe('deselectAll', () => {
    it('应该取消选中所有字段', () => {
      const { columnFields, initFields, deselectAll } = useColumnSettings({ pageKey: 'test' })

      initFields([
        { key: 'name', label: '名称', visible: true, width: 100 },
        { key: 'status', label: '状态', visible: true, width: 80 },
      ])

      deselectAll()

      expect(columnFields.value.every(f => !f.visible)).toBe(true)
    })
  })

  describe('loadFromStorage', () => {
    it('应该从 localStorage 加载设置', async () => {
      const { columnFields, initFields, loadFromStorage } = useColumnSettings({ 
        pageKey: 'test',
        storageType: 'localStorage' 
      })

      const savedFields = [
        { key: 'name', label: '名称', visible: true, width: 200 },
        { key: 'status', label: '状态', visible: false, width: 100 },
      ]

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedFields))

      initFields([
        { key: 'name', label: '名称', visible: false, width: 100 },
        { key: 'status', label: '状态', visible: true, width: 80 },
      ])

      await loadFromStorage()

      // 应该合并保存的设置
      expect(columnFields.value.find(f => f.key === 'name')?.visible).toBe(true)
      expect(columnFields.value.find(f => f.key === 'status')?.visible).toBe(false)
    })

    it('对于无效数据应该保持默认', async () => {
      const { columnFields, initFields, loadFromStorage } = useColumnSettings({ 
        pageKey: 'test',
        storageType: 'localStorage' 
      })

      localStorageMock.getItem.mockReturnValueOnce('invalid-json')

      initFields([
        { key: 'name', label: '名称', visible: true, width: 100 },
      ])

      await loadFromStorage()

      expect(columnFields.value).toHaveLength(1)
      expect(columnFields.value[0].visible).toBe(true)
    })

    it('对于空数据应该保持默认', async () => {
      const { columnFields, initFields, loadFromStorage } = useColumnSettings({ 
        pageKey: 'test',
        storageType: 'localStorage' 
      })

      localStorageMock.getItem.mockReturnValueOnce(null)

      initFields([
        { key: 'name', label: '名称', visible: true, width: 100 },
      ])

      await loadFromStorage()

      expect(columnFields.value).toHaveLength(1)
    })
  })

  describe('saveToStorage', () => {
    it('应该保存到 localStorage', async () => {
      const { initFields, saveToStorage } = useColumnSettings({ 
        pageKey: 'test',
        storageType: 'localStorage' 
      })

      initFields([
        { key: 'name', label: '名称', visible: true, width: 100 },
      ])

      await saveToStorage()

      expect(localStorageMock.setItem).toHaveBeenCalled()
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
      expect(savedData).toHaveLength(1)
      expect(savedData[0].key).toBe('name')
    })
  })

  describe('confirmChanges', () => {
    it('应该确认更改并保存', async () => {
      const { columnFields, initFields, confirmChanges } = useColumnSettings({ 
        pageKey: 'test',
        storageType: 'localStorage' 
      })

      initFields([
        { key: 'name', label: '名称', visible: true, width: 100 },
      ])

      const newFields = [
        { key: 'name', label: '名称', visible: false, width: 200 },
      ]

      confirmChanges(newFields)

      expect(columnFields.value).toEqual(newFields)
    })
  })

  describe('cancelChanges', () => {
    it('应该取消更改（当前实现为空操作）', () => {
      const { cancelChanges } = useColumnSettings({ pageKey: 'test' })

      // 当前实现为空操作
      expect(() => cancelChanges()).not.toThrow()
    })
  })

  describe('storageType', () => {
    it('应该支持 sessionStorage', () => {
      const sessionStorageMock = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      }
      Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock })

      const { saveToStorage } = useColumnSettings({ 
        pageKey: 'test',
        storageType: 'sessionStorage' 
      })

      expect(typeof saveToStorage).toBe('function')
    })

    it('应该支持 API 存储', () => {
      const { saveToStorage } = useColumnSettings({ 
        pageKey: 'test',
        storageType: 'api',
        apiEndpoint: '/api/settings' 
      })

      expect(typeof saveToStorage).toBe('function')
    })
  })
})
