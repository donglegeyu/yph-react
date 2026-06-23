import { useEffect, useRef, useState } from 'react'
import './CustomNavPanel.scss'

const iconMap: Record<string, string> = {
  commodity: 'commodity',
  shopping: 'shopping-cart-del',
  buy: 'buy',
  goods: 'tag',
  file: 'file-cabinet',
  search: 'doc-search',
  user: 'people-top-card',
  safe: 'message-security',
  tool: 'setting',
  app: 'all-application',
  'work-order': 'order',
  alert: 'comments',
  'check-circle': 'list',
  phone: 'comments',
  barcode: 'scan-setting',
  edit: 'edit',
  warning: 'comments',
  'info-circle': 'comments',
  wrench: 'setting',
  package: 'box',
  rule: 'config',
  link: 'database-config',
  'check-square': 'list',
  clipboard: 'table',
  layers: 'category-management',
  team: 'people-top-card',
  award: 'bookmark',
  'file-application': 'doc-search',
  'search-user': 'user-positioning',
  list: 'list',
  star: 'star',
  home: 'home',
  setting: 'setting',
  book: 'doc-search',
  rocket: 'plan',
  'file-text': 'file-cabinet',
  read: 'bookmark',
  'question-circle': 'list',
  form: 'table',
}

function getIconName(icon?: string): string {
  return icon ? iconMap[icon] || icon : 'id-card-v-klbe0a04'
}

export interface MenuItem {
  key: string
  label: string
  icon?: string
  path?: string
  children?: MenuItem[]
}

interface CustomNavPanelProps {
  visible: boolean
  menus: MenuItem[]
  totalCount: number
  selectedMenus: MenuItem[]
  onClose: () => void
  onUpdate: (selected: MenuItem[]) => void
}

export default function CustomNavPanel({
  visible,
  menus,
  totalCount,
  selectedMenus,
  onClose,
  onUpdate,
}: CustomNavPanelProps) {
  const [allMenus, setAllMenus] = useState<MenuItem[]>([])
  const [dragIndex, setDragIndex] = useState(-1)
  const [dragOverIndex, setDragOverIndex] = useState(-1)
  const dragIndexRef = useRef(-1)
  const dragOverIndexRef = useRef(-1)

  useEffect(() => {
    if (visible && menus && menus.length > 0) {
      const safeSelected = Array.isArray(selectedMenus) ? selectedMenus : []
      const safeMenus = Array.isArray(menus) ? menus : []
      const menuMap = new Map(safeMenus.map((menu) => [menu.key, menu]))
      const selectedItems: MenuItem[] = safeSelected
        .map((sm) => {
          const menu = menuMap.get(sm.key)
          if (!menu) return null
          return { key: menu.key, label: menu.label, icon: menu.icon || 'folder-open' } as MenuItem
        })
        .filter((item): item is MenuItem => item !== null)
      const selectedKeys = new Set(selectedItems.map((m) => m.key))
      const unselectedItems: MenuItem[] = safeMenus
        .filter((menu) => !selectedKeys.has(menu.key))
        .map((menu) => ({ key: menu.key, label: menu.label, icon: menu.icon || 'folder-open' } as MenuItem))
      setAllMenus([...selectedItems, ...unselectedItems])
    } else if (!visible) {
      setAllMenus([])
    }
  }, [visible, menus, selectedMenus])

  function onDragStart(e: React.DragEvent, index: number) {
    dragIndexRef.current = index
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  function onDragOverItem(e: React.DragEvent, index: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIndexRef.current !== index) {
      dragOverIndexRef.current = index
      setDragOverIndex(index)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const from = dragIndexRef.current
    const to = dragOverIndexRef.current
    if (from !== -1 && to !== -1 && from !== to) {
      setAllMenus((prev) => {
        const arr = [...prev]
        const [item] = arr.splice(from, 1)
        arr.splice(to, 0, item)
        return arr
      })
    }
    dragIndexRef.current = -1
    dragOverIndexRef.current = -1
    setDragIndex(-1)
    setDragOverIndex(-1)
  }

  function onDragEnd() {
    dragIndexRef.current = -1
    dragOverIndexRef.current = -1
    setDragIndex(-1)
    setDragOverIndex(-1)
  }

  function handleCancel() {
    onClose()
  }

  function handleConfirm() {
    const selectedItems = allMenus.slice(0, totalCount)
    onUpdate(selectedItems)
    onClose()
  }

  if (!visible) return null

  return (
    <div className="custom-nav-panel">
      <div className="panel-header">
        <h3 className="panel-title">自定义导航栏</h3>
        <p className="panel-desc">拖拽排序，前 {totalCount} 个菜单会显示在导航栏上</p>
      </div>
      <div className="panel-content">
        <div className="menu-list">
          {allMenus.map((item, index) => (
            <div key={item.key}>
              {index === totalCount && <div className="menu-divider" />}
              <div
                className={`menu-item${index < totalCount ? ' on-nav' : ''}${dragIndex === index ? ' dragging' : ''}${dragOverIndex === index ? ' drag-over' : ''}`}
                draggable
                onDragStart={(e) => onDragStart(e, index)}
                onDragOver={(e) => onDragOverItem(e, index)}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
              >
                <div className="drag-handle">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <circle cx="8" cy="6" r="1.5" fill="currentColor" />
                    <circle cx="16" cy="6" r="1.5" fill="currentColor" />
                    <circle cx="8" cy="12" r="1.5" fill="currentColor" />
                    <circle cx="16" cy="12" r="1.5" fill="currentColor" />
                    <circle cx="8" cy="18" r="1.5" fill="currentColor" />
                    <circle cx="16" cy="18" r="1.5" fill="currentColor" />
                  </svg>
                </div>
                <div className="menu-icon">
                  <svg viewBox="0 0 48 48" width="16" height="16">
                    <use href={`#${getIconName(item.icon)}`} />
                  </svg>
                </div>
                <span className="menu-label">{item.label}</span>
                {index < totalCount && <span className="nav-badge">导航栏</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel-footer">
        <button className="btn btn-cancel" onClick={handleCancel}>
          取消
        </button>
        <button className="btn btn-confirm" onClick={handleConfirm}>
          确认
        </button>
      </div>
    </div>
  )
}
