import { useEffect, useRef, useState } from 'react'
import './CustomNavPanel.scss'

const iconMap: Record<string, string> = {
  commodity: 'tag',
  shopping: 'shopping-cart-del',
  buy: 'shopping-cart-del',
  goods: 'tag',
  file: 'file-cabinet',
  search: 'doc-search',
  user: 'people-top-card',
  safe: 'message-security',
  tool: 'setting',
  app: 'all-application',
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
  const dragIndexRef = useRef(-1)

  useEffect(() => {
    if (visible && menus && menus.length > 0) {
      const safeSelected = Array.isArray(selectedMenus) ? selectedMenus : []
      const selectedKeys = new Set(safeSelected.map((m) => m.key))
      const safeMenus = Array.isArray(menus) ? menus : []
      const menuItems: MenuItem[] = safeMenus.map((menu) => ({
        key: menu.key,
        label: menu.label,
        icon: menu.icon || 'folder-open',
      }))
      const selectedItems = menuItems.filter((item) => selectedKeys.has(item.key))
      const unselectedItems = menuItems.filter((item) => !selectedKeys.has(item.key))
      setAllMenus([...selectedItems, ...unselectedItems])
    } else if (!visible) {
      setAllMenus([])
    }
  }, [visible, menus, selectedMenus])

  function onDragStart(e: React.DragEvent, index: number) {
    dragIndexRef.current = index
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function onDragEnter(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (dragIndexRef.current !== -1 && dragIndexRef.current !== index) {
      setAllMenus((prev) => {
        const arr = [...prev]
        const [item] = arr.splice(dragIndexRef.current, 1)
        arr.splice(index, 0, item)
        dragIndexRef.current = index
        return arr
      })
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
  }

  function onDragEnd() {
    dragIndexRef.current = -1
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
                className={`menu-item${index < totalCount ? ' on-nav' : ''}${dragIndexRef.current === index ? ' dragging' : ''}`}
                draggable
                onDragStart={(e) => onDragStart(e, index)}
                onDragOver={onDragOver}
                onDragEnter={(e) => onDragEnter(e, index)}
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
