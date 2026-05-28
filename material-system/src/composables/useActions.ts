import { ref } from 'vue'
import { useRouter } from 'vue-router'

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
  router?: ReturnType<typeof useRouter>
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
  const {
    router,
    detailPath,
    editPath,
    deleteApi,
    onDeleteSuccess,
    onDetail,
    onEdit,
    onDelete,
    onSubmit,
  } = options

  const deleting = ref(false)

  function getDetailPath(record: any): string | undefined {
    if (!detailPath) return undefined
    if (typeof detailPath === 'function') {
      return detailPath(record)
    }
    return `${detailPath}/${record.id}`
  }

  function getEditPath(record: any): string | undefined {
    if (!editPath) return undefined
    if (typeof editPath === 'function') {
      return editPath(record)
    }
    return `${editPath}/${record.id}/edit`
  }

  function handleDetail(record: any) {
    if (onDetail) {
      onDetail(record)
      return
    }
    
    const path = getDetailPath(record)
    if (path && router) {
      router.push(path)
    }
  }

  function handleEdit(record: any) {
    if (onEdit) {
      onEdit(record)
      return
    }
    
    const path = getEditPath(record)
    if (path && router) {
      router.push(path)
    }
  }

  async function handleDelete(record: any, confirmCallback?: () => void): Promise<boolean> {
    if (onDelete) {
      onDelete(record)
      return true
    }

    if (deleteApi) {
      deleting.value = true
      try {
        const res = await fetch(`${deleteApi}/${record.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        })
        
        if (res.ok) {
          const json = await res.json()
          if (json.code === 200) {
            if (onDeleteSuccess) {
              onDeleteSuccess()
            }
            return true
          }
        }
        return false
      } catch (e) {
        console.error('[useActions] 删除失败', e)
        return false
      } finally {
        deleting.value = false
      }
    }

    if (confirmCallback) {
      confirmCallback()
    }

    return true
  }

  function handleSubmit(record: any) {
    if (onSubmit) {
      onSubmit(record)
    }
  }

  function getActionButtons(
    record: any,
    customButtons?: ActionButton[]
  ): ActionButton[] {
    const buttons: ActionButton[] = []

    buttons.push({
      key: 'detail',
      label: '详情',
      type: 'text',
      onClick: () => handleDetail(record),
    })

    buttons.push({
      key: 'edit',
      label: '编辑',
      type: 'text',
      onClick: () => handleEdit(record),
    })

    if (onSubmit) {
      buttons.push({
        key: 'submit',
        label: '提交',
        type: 'text',
        onClick: () => handleSubmit(record),
      })
    }

    buttons.push({
      key: 'delete',
      label: '删除',
      danger: true,
      confirm: true,
      confirmTitle: '确定删除？',
      type: 'text',
      onClick: () => handleDelete(record),
    })

    if (customButtons && customButtons.length > 0) {
      const customButtonMap = new Map(customButtons.map(btn => [btn.key, btn]))
      
      return buttons.map(btn => {
        const customBtn = customButtonMap.get(btn.key)
        if (customBtn) {
          return { ...btn, ...customBtn }
        }
        return btn
      })
    }

    return buttons
  }

  function getDetailButton(record: any): ActionButton {
    return {
      key: 'detail',
      label: '详情',
      type: 'primary',
      onClick: () => handleDetail(record),
    }
  }

  function getEditButton(record: any): ActionButton {
    return {
      key: 'edit',
      label: '编辑',
      type: 'default',
      onClick: () => handleEdit(record),
    }
  }

  function getDeleteButton(
    record: any,
    confirmCallback?: () => void
  ): ActionButton {
    return {
      key: 'delete',
      label: '删除',
      danger: true,
      confirm: true,
      confirmTitle: '确定删除？',
      onClick: () => handleDelete(record, confirmCallback),
    }
  }

  function getSubmitButton(record: any): ActionButton {
    return {
      key: 'submit',
      label: '提交',
      type: 'primary',
      onClick: () => handleSubmit(record),
    }
  }

  function createCustomButton(
    key: string,
    label: string,
    onClick: (record: any) => void,
    options?: Partial<ActionButton>
  ): ActionButton {
    return {
      key,
      label,
      type: 'text',
      onClick,
      ...options,
    }
  }

  function filterVisibleButtons(buttons: ActionButton[]): ActionButton[] {
    return buttons.filter(btn => !btn.hidden && btn.visible !== false)
  }

  function filterEnabledButtons(buttons: ActionButton[]): ActionButton[] {
    return buttons.filter(btn => !btn.disabled)
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
