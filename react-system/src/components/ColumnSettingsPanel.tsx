import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Popover, Checkbox, Button } from 'antd'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import SvgIcon from './SvgIcon'

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
      destroyTooltipOnHide
      styles={{
        body: {
          width: 180,
          maxHeight: 280,
          padding: 0,
        },
      }}
      content={
        <div className="column-settings-panel" style={{ width: 180, maxHeight: 280, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box' }}>
          <div style={{ flexShrink: 0, padding: '12px 8px 0 8px', boxSizing: 'border-box' }}>
            <div className="search-wrapper" style={{ display: 'flex', alignItems: 'center', height: 32, padding: '0 8px', gap: 12, borderRadius: 4, background: 'rgba(0, 0, 0, 0.02)', border: '1px solid transparent', transition: 'all 0.2s', boxSizing: 'border-box' }}>
              <SvgIcon href="search" size={16} style={{ stroke: 'rgba(0, 0, 0, 0.65)', strokeWidth: 1.5, fill: 'none', flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                placeholder="搜索字段名称"
                style={{ flex: 1, height: 32, border: 'none', background: 'transparent', color: 'rgba(0, 0, 0, 0.85)', fontSize: 14, lineHeight: '32px', outline: 'none', fontFamily: '-apple-system, BlinkMacSystemFont, PingFang SC, Helvetica Neue, Helvetica, Arial, sans-serif', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div className="field-list" style={{ flex: 1, overflowY: 'auto', padding: '8px 8px', margin: 0, minHeight: 0, boxSizing: 'border-box' }}>
            {filteredFields.map((field, index) => (
              <div
                key={field.key}
                className="field-item"
                draggable
                onDragStart={e => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                style={{ display: 'flex', flexDirection: 'column', padding: '4px 8px', cursor: 'move', transition: 'background-color 0.2s', boxSizing: 'border-box' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f5f5f5'; e.currentTarget.style.borderRadius = '4px' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderRadius = '0' }}
              >
                <div className="field-row" style={{ display: 'flex', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
                  <SvgIcon href="drag" size={12} style={{ marginRight: 8, color: 'rgba(0, 0, 0, 0.45)', flexShrink: 0, cursor: 'grab' }} />
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
              <div className="no-data" style={{ padding: 20, textAlign: 'center', color: '#999', fontSize: 14 }}>
                暂无数据
              </div>
            )}
          </div>

          <div className="action-buttons" style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 12, borderTop: '1px solid #f0f0f0', boxSizing: 'border-box' }}>
            <Button size="small" onClick={handleReset}>重置</Button>
            <Button type="primary" size="small" onClick={handleConfirm}>确定</Button>
          </div>
        </div>
      }
    >
      {children || (
        <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 4, border: '1px solid #d9d9d9', background: '#fff' }}>
          <SvgIcon href="setting" size={16} />
        </div>
      )}
    </Popover>
  )
}
