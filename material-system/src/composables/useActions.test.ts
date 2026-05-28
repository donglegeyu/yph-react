import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useActions } from './useActions'

// Mock fetch
global.fetch = vi.fn()

const mockFetch = global.fetch as jest.Mock

describe('useActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('初始化', () => {
    it('应该返回一个对象', () => {
      const result = useActions()
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('应该包含必要的方法', () => {
      const {
        deleting,
        handleDetail,
        handleEdit,
        handleDelete,
        handleSubmit,
        getActionButtons,
        getDetailButton,
        getEditButton,
        getDeleteButton,
        getSubmitButton,
        createCustomButton,
        filterVisibleButtons,
        filterEnabledButtons,
      } = useActions()

      expect(deleting.value).toBe(false)
      expect(typeof handleDetail).toBe('function')
      expect(typeof handleEdit).toBe('function')
      expect(typeof handleDelete).toBe('function')
      expect(typeof handleSubmit).toBe('function')
      expect(typeof getActionButtons).toBe('function')
      expect(typeof getDetailButton).toBe('function')
      expect(typeof getEditButton).toBe('function')
      expect(typeof getDeleteButton).toBe('function')
      expect(typeof getSubmitButton).toBe('function')
      expect(typeof createCustomButton).toBe('function')
      expect(typeof filterVisibleButtons).toBe('function')
      expect(typeof filterEnabledButtons).toBe('function')
    })
  })

  describe('getActionButtons', () => {
    it('应该返回默认的操作按钮列表', () => {
      const { getActionButtons } = useActions()

      const record = { id: 1, name: 'Test' }
      const buttons = getActionButtons(record)

      expect(buttons).toHaveLength(3)  // detail, edit, delete（默认没有 submit）
      expect(buttons.map(b => b.key)).toEqual(['detail', 'edit', 'delete'])
    })

    it('应该包含正确的按钮属性', () => {
      const { getActionButtons } = useActions()

      const record = { id: 1, name: 'Test' }
      const buttons = getActionButtons(record)

      const detailBtn = buttons.find(b => b.key === 'detail')
      expect(detailBtn?.label).toBe('详情')
      expect(detailBtn?.type).toBe('text')

      const deleteBtn = buttons.find(b => b.key === 'delete')
      expect(deleteBtn?.danger).toBe(true)
      expect(deleteBtn?.confirm).toBe(true)
    })

    it('应该支持自定义按钮', () => {
      // customButtons 用来覆盖现有按钮，而不是添加新按钮
      const customButtons = [
        { key: 'detail', label: '查看', type: 'primary' as const }  // 覆盖 detail 按钮
      ]

      const { getActionButtons } = useActions()

      const record = { id: 1, name: 'Test' }
      const buttons = getActionButtons(record, customButtons)

      expect(buttons).toHaveLength(3)  // detail, edit, delete
      const detailBtn = buttons.find(b => b.key === 'detail')
      expect(detailBtn?.label).toBe('查看')  // 被覆盖为"查看"
      expect(detailBtn?.type).toBe('primary')  // 被覆盖为 primary
    })
  })

  describe('handleDetail', () => {
    it('应该调用 onDetail 回调', () => {
      const onDetail = vi.fn()
      const { handleDetail } = useActions({ onDetail })

      const record = { id: 1, name: 'Test' }
      handleDetail(record)

      expect(onDetail).toHaveBeenCalledWith(record)
    })

    it('在没有 onDetail 时应该不抛出错误', () => {
      const { handleDetail } = useActions()

      const record = { id: 1, name: 'Test' }
      expect(() => handleDetail(record)).not.toThrow()
    })
  })

  describe('handleEdit', () => {
    it('应该调用 onEdit 回调', () => {
      const onEdit = vi.fn()
      const { handleEdit } = useActions({ onEdit })

      const record = { id: 1, name: 'Test' }
      handleEdit(record)

      expect(onEdit).toHaveBeenCalledWith(record)
    })
  })

  describe('handleDelete', () => {
    it('应该调用 onDelete 回调', async () => {
      const onDelete = vi.fn()
      const { handleDelete } = useActions({ onDelete })

      const record = { id: 1, name: 'Test' }
      const result = await handleDelete(record)

      expect(onDelete).toHaveBeenCalledWith(record)
      expect(result).toBe(true)
    })

    it('应该从 API 删除数据', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 200 }),
      })

      const { handleDelete } = useActions({
        deleteApi: '/api/test'
      })

      const record = { id: 1, name: 'Test' }
      const result = await handleDelete(record)

      expect(mockFetch).toHaveBeenCalledWith('/api/test/1', expect.objectContaining({ method: 'DELETE' }))
      expect(result).toBe(true)
    })

    it('应该在删除失败时返回 false', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 500, message: '删除失败' }),
      })

      const { handleDelete } = useActions({
        deleteApi: '/api/test'
      })

      const record = { id: 1, name: 'Test' }
      const result = await handleDelete(record)

      expect(result).toBe(false)
    })

    it('应该在网络错误时返回 false', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network Error'))

      const { handleDelete } = useActions({
        deleteApi: '/api/test'
      })

      const record = { id: 1, name: 'Test' }
      const result = await handleDelete(record)

      expect(result).toBe(false)
    })

    it('应该调用 onDeleteSuccess 回调', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 200 }),
      })

      const onDeleteSuccess = vi.fn()
      const { handleDelete } = useActions({
        deleteApi: '/api/test',
        onDeleteSuccess
      })

      const record = { id: 1, name: 'Test' }
      await handleDelete(record)

      expect(onDeleteSuccess).toHaveBeenCalled()
    })
  })

  describe('handleSubmit', () => {
    it('应该调用 onSubmit 回调', () => {
      const onSubmit = vi.fn()
      const { handleSubmit } = useActions({ onSubmit })

      const record = { id: 1, name: 'Test' }
      handleSubmit(record)

      expect(onSubmit).toHaveBeenCalledWith(record)
    })
  })

  describe('getDetailButton', () => {
    it('应该返回详情按钮', () => {
      const { getDetailButton } = useActions()

      const record = { id: 1, name: 'Test' }
      const button = getDetailButton(record)

      expect(button.key).toBe('detail')
      expect(button.label).toBe('详情')
      expect(button.type).toBe('primary')
      expect(typeof button.onClick).toBe('function')
    })
  })

  describe('getEditButton', () => {
    it('应该返回编辑按钮', () => {
      const { getEditButton } = useActions()

      const record = { id: 1, name: 'Test' }
      const button = getEditButton(record)

      expect(button.key).toBe('edit')
      expect(button.label).toBe('编辑')
      expect(button.type).toBe('default')
    })
  })

  describe('getDeleteButton', () => {
    it('应该返回删除按钮', () => {
      const { getDeleteButton } = useActions()

      const record = { id: 1, name: 'Test' }
      const button = getDeleteButton(record)

      expect(button.key).toBe('delete')
      expect(button.label).toBe('删除')
      expect(button.danger).toBe(true)
      expect(button.confirm).toBe(true)
      expect(button.confirmTitle).toBe('确定删除？')
    })

    it('应该支持自定义确认回调', () => {
      const confirmCallback = vi.fn()
      const { getDeleteButton } = useActions()

      const record = { id: 1, name: 'Test' }
      const button = getDeleteButton(record, confirmCallback)

      expect(button.onClick).toBeDefined()
    })
  })

  describe('getSubmitButton', () => {
    it('应该返回提交按钮', () => {
      const { getSubmitButton } = useActions()

      const record = { id: 1, name: 'Test' }
      const button = getSubmitButton(record)

      expect(button.key).toBe('submit')
      expect(button.label).toBe('提交')
      expect(button.type).toBe('primary')
    })
  })

  describe('createCustomButton', () => {
    it('应该创建自定义按钮', () => {
      const onClick = vi.fn()
      const { createCustomButton } = useActions()

      const button = createCustomButton('custom', '自定义', onClick)

      expect(button.key).toBe('custom')
      expect(button.label).toBe('自定义')
      expect(button.type).toBe('text')
      expect(button.onClick).toBe(onClick)
    })

    it('应该支持额外选项', () => {
      const onClick = vi.fn()
      const { createCustomButton } = useActions()

      const button = createCustomButton('custom', '自定义', onClick, {
        type: 'primary',
        danger: true,
        icon: 'check',
      })

      expect(button.type).toBe('primary')
      expect(button.danger).toBe(true)
      expect(button.icon).toBe('check')
    })
  })

  describe('filterVisibleButtons', () => {
    it('应该过滤可见按钮', () => {
      const { filterVisibleButtons } = useActions()

      const buttons = [
        { key: 'visible', label: '可见', visible: true },
        { key: 'hidden', label: '隐藏', visible: false, hidden: true },
      ] as any

      const filtered = filterVisibleButtons(buttons)

      expect(filtered).toHaveLength(1)
      expect(filtered[0].key).toBe('visible')
    })

    it('应该处理 undefined visible', () => {
      const { filterVisibleButtons } = useActions()

      const buttons = [
        { key: 'normal', label: '正常' },
      ] as any

      const filtered = filterVisibleButtons(buttons)

      expect(filtered).toHaveLength(1)
    })
  })

  describe('filterEnabledButtons', () => {
    it('应该过滤启用按钮', () => {
      const { filterEnabledButtons } = useActions()

      const buttons = [
        { key: 'enabled', label: '启用', disabled: false },
        { key: 'disabled', label: '禁用', disabled: true },
      ] as any

      const filtered = filterEnabledButtons(buttons)

      expect(filtered).toHaveLength(1)
      expect(filtered[0].key).toBe('enabled')
    })
  })

  describe('deleting 状态', () => {
    it('应该在删除过程中设置为 true', async () => {
      mockFetch.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ code: 200 }),
            })
          }, 100)
        })
      })

      const { deleting, handleDelete } = useActions({
        deleteApi: '/api/test'
      })

      const record = { id: 1, name: 'Test' }
      
      expect(deleting.value).toBe(false)

      const promise = handleDelete(record)
      expect(deleting.value).toBe(true)

      await promise
      expect(deleting.value).toBe(false)
    })
  })

  describe('按钮点击行为', () => {
    it('详情按钮应该调用 onDetail', () => {
      const onDetail = vi.fn()
      const { getActionButtons } = useActions({ onDetail })

      const record = { id: 1, name: 'Test' }
      const buttons = getActionButtons(record)
      const detailBtn = buttons.find(b => b.key === 'detail')

      detailBtn?.onClick?.(record)

      expect(onDetail).toHaveBeenCalledWith(record)
    })

    it('编辑按钮应该调用 onEdit', () => {
      const onEdit = vi.fn()
      const { getActionButtons } = useActions({ onEdit })

      const record = { id: 1, name: 'Test' }
      const buttons = getActionButtons(record)
      const editBtn = buttons.find(b => b.key === 'edit')

      editBtn?.onClick?.(record)

      expect(onEdit).toHaveBeenCalledWith(record)
    })

    it('删除按钮应该调用 onDelete', async () => {
      const onDelete = vi.fn()
      const { getActionButtons } = useActions({ onDelete })

      const record = { id: 1, name: 'Test' }
      const buttons = getActionButtons(record)
      const deleteBtn = buttons.find(b => b.key === 'delete')

      await deleteBtn?.onClick?.(record)

      expect(onDelete).toHaveBeenCalledWith(record)
    })

    it('提交按钮应该调用 onSubmit', () => {
      const onSubmit = vi.fn()
      const { getActionButtons } = useActions({ onSubmit })

      const record = { id: 1, name: 'Test' }
      const buttons = getActionButtons(record)
      const submitBtn = buttons.find(b => b.key === 'submit')

      submitBtn?.onClick?.(record)

      expect(onSubmit).toHaveBeenCalledWith(record)
    })
  })
})
