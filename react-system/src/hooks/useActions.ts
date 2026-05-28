import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

export interface ActionButton {
  key: string
  label: string
  type?: 'primary' | 'default' | 'text' | 'link'
  danger?: boolean
  disabled?: boolean
  hidden?: boolean
  confirm?: boolean
  confirmTitle?: string
  confirmContent?: string
  icon?: string
  onClick?: (record: any) => void
  [key: string]: any
}

export interface UseActionsOptions {
  detailPath?: string | ((record: any) => string)
  editPath?: string | ((record: any) => string)
  deleteApi?: string
  onDeleteSuccess?: () => void
  onDetail?: (record: any) => void
  onEdit?: (record: any) => void
  onDelete?: (record: any) => void
  onSubmit?: (record: any) => void
}

export function useActions(options: UseActionsOptions = {}) {
  const navigate = useNavigate()

  const { detailPath, editPath, deleteApi, onDeleteSuccess, onDetail, onEdit, onDelete, onSubmit } = options

  const [deleting, setDeleting] = useState(false)

  function getDetailPath(record: any): string | undefined {
    if (!detailPath) return undefined
    if (typeof detailPath === 'function') return detailPath(record)
    return `${detailPath}/${record.id}`
  }

  function getEditPath(record: any): string | undefined {
    if (!editPath) return undefined
    if (typeof editPath === 'function') return editPath(record)
    return `${editPath}/${record.id}/edit`
  }

  const handleDetail = useCallback(
    (record: any) => {
      if (onDetail) {
        onDetail(record)
        return
      }
      const path = getDetailPath(record)
      if (path) navigate(path)
    },
    [onDetail, detailPath, navigate]
  )

  const handleEdit = useCallback(
    (record: any) => {
      if (onEdit) {
        onEdit(record)
        return
      }
      const path = getEditPath(record)
      if (path) navigate(path)
    },
    [onEdit, editPath, navigate]
  )

  const handleDelete = useCallback(
    async (record: any, confirmCallback?: () => void): Promise<boolean> => {
      if (onDelete) {
        onDelete(record)
        return true
      }
      if (deleteApi) {
        setDeleting(true)
        try {
          const res = await fetch(`${deleteApi}/${record.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          })
          if (res.ok) {
            const json = await res.json()
            if (json.code === 200) {
              if (onDeleteSuccess) onDeleteSuccess()
              return true
            }
          }
          return false
        } catch (e) {
          console.error('[useActions] 删除失败', e)
          return false
        } finally {
          setDeleting(false)
        }
      }
      if (confirmCallback) confirmCallback()
      return true
    },
    [onDelete, deleteApi, onDeleteSuccess]
  )

  const handleSubmit = useCallback(
    (record: any) => {
      if (onSubmit) onSubmit(record)
    },
    [onSubmit]
  )

  function getActionButtons(record: any, customButtons?: ActionButton[]): ActionButton[] {
    const buttons: ActionButton[] = [
      { key: 'detail', label: '详情', type: 'text', onClick: () => handleDetail(record) },
      { key: 'edit', label: '编辑', type: 'text', onClick: () => handleEdit(record) },
      ...(onSubmit ? [{ key: 'submit', label: '提交', type: 'text' as const, onClick: () => handleSubmit(record) }] : []),
      { key: 'delete', label: '删除', danger: true, confirm: true, confirmTitle: '确定删除？', type: 'text' as const, onClick: () => handleDelete(record) },
    ]
    if (customButtons?.length) {
      const customMap = new Map(customButtons.map((btn) => [btn.key, btn]))
      return buttons.map((btn) => {
        const custom = customMap.get(btn.key)
        return custom ? { ...btn, ...custom } : btn
      })
    }
    return buttons
  }

  function getDetailButton(record: any): ActionButton {
    return { key: 'detail', label: '详情', type: 'primary', onClick: () => handleDetail(record) }
  }

  function getEditButton(record: any): ActionButton {
    return { key: 'edit', label: '编辑', type: 'default', onClick: () => handleEdit(record) }
  }

  function getDeleteButton(record: any, confirmCallback?: () => void): ActionButton {
    return { key: 'delete', label: '删除', danger: true, confirm: true, confirmTitle: '确定删除？', onClick: () => handleDelete(record, confirmCallback) }
  }

  function getSubmitButton(record: any): ActionButton {
    return { key: 'submit', label: '提交', type: 'primary', onClick: () => handleSubmit(record) }
  }

  function createCustomButton(key: string, label: string, onClick: (record: any) => void, options?: Partial<ActionButton>): ActionButton {
    return { key, label, type: 'text', onClick, ...options }
  }

  function filterVisibleButtons(buttons: ActionButton[]): ActionButton[] {
    return buttons.filter((btn) => !btn.hidden && btn.visible !== false)
  }

  function filterEnabledButtons(buttons: ActionButton[]): ActionButton[] {
    return buttons.filter((btn) => !btn.disabled)
  }

  return {
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
  }
}
