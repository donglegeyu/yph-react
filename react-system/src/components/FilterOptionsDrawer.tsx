import { useState, useEffect, useCallback } from 'react'
import { Checkbox, Select, Input } from 'antd'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import { CompanyDrawer, CompanyButton } from '@donglegeyu/company-ui'
import SvgIcon from './SvgIcon'

export interface FilterOption {
  key: string
  label: string
  checked: boolean
  options?: Array<{ label: string; value: string }>
  defaultValue?: unknown
}

interface FilterOptionsDrawerProps {
  open: boolean
  options: FilterOption[]
  isEdit?: boolean
  editName?: string
  editId?: string
  onClose?: () => void
  onSave?: (data: { name: string; id?: string; options: FilterOption[] }) => void
}

export default function FilterOptionsDrawer({
  open,
  options,
  isEdit = false,
  editName = '',
  editId = '',
  onClose,
  onSave,
}: FilterOptionsDrawerProps) {
  const [schemeName, setSchemeName] = useState(editName)
  const [editingId, setEditingId] = useState(editId)
  const [localOptions, setLocalOptions] = useState<FilterOption[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  useEffect(() => {
    if (open) {
      setLocalOptions(
        options.map(opt => ({
          key: opt.key,
          label: opt.label,
          checked: opt.checked,
          options: opt.options ? [...opt.options] : undefined,
          defaultValue: opt.defaultValue,
        }))
      )
      setSchemeName(editName)
      setEditingId(editId)
    }
  }, [open, options, editName, editId])

  const handleClose = useCallback(() => {
    onClose?.()
  }, [onClose])

  const handleSave = useCallback(() => {
    if (!schemeName.trim()) return

    const selectedCount = localOptions.filter(opt => opt.checked).length
    if (selectedCount === 0) return

    onSave?.({
      name: schemeName.trim(),
      id: editingId,
      options: [...localOptions],
    })
  }, [schemeName, localOptions, editingId, onSave])

  const handleCheckedChange = useCallback((index: number, checked: boolean) => {
    setLocalOptions(prev =>
      prev.map((item, i) => (i === index ? { ...item, checked } : item))
    )
  }, [])

  const handleDefaultValueChange = useCallback((index: number, value: unknown) => {
    setLocalOptions(prev =>
      prev.map((item, i) => (i === index ? { ...item, defaultValue: value } : item))
    )
  }, [])

  const handleDragStart = useCallback((event: React.DragEvent, index: number) => {
    setDragIndex(index)
    event.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((event: React.DragEvent, index: number) => {
    event.preventDefault()
    if (dragIndex === null || dragIndex === index) return

    const items = [...localOptions]
    const [dragItem] = items.splice(dragIndex, 1)
    items.splice(index, 0, dragItem)
    setLocalOptions(items)
    setDragIndex(null)
  }, [dragIndex, localOptions])

  const handleDragEnd = useCallback(() => {
    setDragIndex(null)
  }, [])

  return (
    <CompanyDrawer
      title={isEdit ? '编辑视图' : '新增视图'}
      open={open}
      onClose={handleClose}
      size={380}
      footer={
        <div style={{ textAlign: 'right' }}>
          <CompanyButton onClick={handleClose}>取消</CompanyButton>
          <CompanyButton type="primary" style={{ marginLeft: 8 }} onClick={handleSave}>
            保存
          </CompanyButton>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="view-name-section">
          <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(0, 0, 0, 0.85)', marginBottom: 8 }}>
            视图名称
            <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
          </div>
          <Input
            value={schemeName}
            onChange={e => setSchemeName(e.target.value)}
            placeholder="请输入视图名称（最多8个字）"
            maxLength={8}
            showCount
          />
        </div>

        <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)', marginBottom: 8 }}>
          勾选并调整视图条件顺序后保存
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {localOptions.map((item, index) => (
            <div
              key={item.key}
              draggable
              onDragStart={e => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              style={{
                background: '#fafafa',
                borderRadius: 4,
                padding: 12,
                cursor: 'move',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fafafa' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SvgIcon href="drag" size={16} style={{ flexShrink: 0, cursor: 'grab', color: 'rgba(0, 0, 0, 0.25)' }} />
                <Checkbox
                  checked={item.checked}
                  onChange={(e: CheckboxChangeEvent) => handleCheckedChange(index, e.target.checked)}
                >
                  {item.label}
                </Checkbox>
              </div>
              {item.checked && (
                <div style={{ marginTop: 8, marginLeft: 24 }}>
                  {item.options ? (
                    <Select
                      value={item.defaultValue || ''}
                      onChange={val => handleDefaultValueChange(index, val)}
                      options={item.options}
                      placeholder="默认值"
                      style={{ width: '100%' }}
                      allowClear
                    />
                  ) : (
                    <Input
                      value={item.defaultValue as string || ''}
                      onChange={e => handleDefaultValueChange(index, e.target.value)}
                      placeholder="默认日期"
                      style={{ width: '100%' }}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </CompanyDrawer>
  )
}
