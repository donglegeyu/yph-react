import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Popover, Checkbox, Button } from 'antd'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import SvgIcon from './SvgIcon'
import './ColumnSettingsPanel.scss'

export interface ColumnField {
  key: string
  label: string
  visible: boolean
  width?: number
  fixed?: 'left' | 'right'
}

interface ColumnSettingsPanelProps {
  fields: ColumnField[]
  defaultFields: ColumnField[]
  excludeKeys?: string[]
  children?: React.ReactNode
  onConfirm?: (fields: ColumnField[]) => void
  onReset?: () => void
}

export default function ColumnSettingsPanel({
  fields,
  defaultFields,
  excludeKeys = [],
  children,
  onConfirm,
  onReset,
}: ColumnSettingsPanelProps) {
  const [open, setOpen] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [localFields, setLocalFields] = useState<ColumnField[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const filteredFields = useMemo(() => {
    let result = localFields.filter(field => !excludeKeys.includes(field.key))
    if (!searchKeyword) return result
    const keyword = searchKeyword.toLowerCase()
    return result.filter(field =>
      field.label.toLowerCase().includes(keyword)
    )
  }, [localFields, searchKeyword, excludeKeys])

  useEffect(() => {
    setLocalFields(JSON.parse(JSON.stringify(fields)))
  }, [fields])

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      setLocalFields(JSON.parse(JSON.stringify(fields)))
      setSearchKeyword('')
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 0)
    }
  }, [fields])

  const handleFieldToggle = useCallback((key: string, checked: boolean) => {
    setLocalFields(prev =>
      prev.map(f => (f.key === key ? { ...f, visible: checked } : f))
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
    const items = [...localFields]
    const [dragItem] = items.splice(dragIndex, 1)
    items.splice(index, 0, dragItem)
    setLocalFields(items)
    setDragIndex(null)
  }, [dragIndex, localFields])

  const handleDragEnd = useCallback(() => {
    setDragIndex(null)
  }, [])

  const handleConfirm = useCallback(() => {
    onConfirm?.(JSON.parse(JSON.stringify(localFields)))
    setOpen(false)
  }, [onConfirm, localFields])

  const handleReset = useCallback(() => {
    setLocalFields(JSON.parse(JSON.stringify(defaultFields)))
    onReset?.()
  }, [defaultFields, onReset])

  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
      trigger="click"
      placement="bottomLeft"
      arrow={false}
      overlayClassName="column-settings-popover"
      destroyOnHidden
      styles={{
        root: {
          margin: '6px 0 0 0',
        },
      }}
      content={
        <div className="column-settings-panel">
          <div className="search-area">
            <div className="search-wrapper">
              <SvgIcon href="search" size={16} className="search-icon" />
              <input
                ref={searchInputRef}
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                placeholder="搜索字段名称"
                className="search-input"
              />
            </div>
          </div>

          <div className="field-list">
            {filteredFields.map((field, index) => (
              <div
                key={field.key}
                className="field-item"
                draggable
                onDragStart={e => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                <div className="field-row">
                  <SvgIcon href="drag" size={12} className="drag-icon" />
                  <Checkbox
                    checked={field.visible}
                    onChange={(e: CheckboxChangeEvent) => handleFieldToggle(field.key, e.target.checked)}
                  >
                    {field.label}
                  </Checkbox>
                </div>
              </div>
            ))}
            {filteredFields.length === 0 && (
              <div className="no-data">
                暂无数据
              </div>
            )}
          </div>

          <div className="action-buttons">
            <Button size="small" onClick={handleReset}>重置</Button>
            <Button type="primary" size="small" onClick={handleConfirm}>确定</Button>
          </div>
        </div>
      }
    >
      {children || (
        <div className="icon-only-btn" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 4, border: '1px solid #d9d9d9', background: '#fff' }}>
          <SvgIcon href="setting" size={16} />
        </div>
      )}
    </Popover>
  )
}
