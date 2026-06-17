import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/app'
import './MoreMenuDrawer.scss'

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
}

function getIconName(icon?: string): string {
  return icon ? iconMap[icon] || icon : 'id-card-v-klbe0a04'
}

interface MoreMenuDrawerProps {
  visible: boolean
  menus: any[]
  onClose: () => void
  onSelect: (menu: any) => void
  onOpenCustomNav: () => void
}

export default function MoreMenuDrawer({
  visible,
  menus,
  onClose,
  onSelect,
  onOpenCustomNav,
}: MoreMenuDrawerProps) {
  const navigate = useNavigate()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedKey, setSelectedKey] = useState('')
  const [selectedMenu, setSelectedMenu] = useState<any>(null)

  const isFavorited = useAppStore((s) => s.isFavorited)
  const toggleFavorite = useAppStore((s) => s.toggleFavorite)

  const filteredMenus = useMemo(() => {
    if (!searchKeyword) return menus
    const keyword = searchKeyword.toLowerCase()
    return menus.filter(
      (menu: any) =>
        menu.label.toLowerCase().includes(keyword) ||
        menu.children?.some((child: any) =>
          child.label.toLowerCase().includes(keyword)
        )
    )
  }, [menus, searchKeyword])

  useEffect(() => {
    if (visible && menus.length > 0) {
      const firstMenu = menus[0]
      setSelectedKey(firstMenu.key)
      setSelectedMenu(firstMenu)
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [visible, menus])

  function handleSelect(menu: any) {
    setSelectedKey(menu.key)
    setSelectedMenu(menu)
  }

  function handleChildClick(child: any, parentMenu?: any) {
    if (child.path) {
      const firstKey = selectedKey
      const state = useAppStore.getState()
      if (firstKey) {
        state.setActiveFirstMenu(firstKey)
        state.promoteToNav(firstKey)
      }
      if (parentMenu && !state.expandedKeys.includes(parentMenu.key)) {
        state.addExpandedKey(parentMenu.key)
      }
      state.setActiveKey(child.key)
      if (!state.secondSidebarFixed) {
        state.cancelHideSidebar()
      }
      navigate(child.path)
      handleClose()
    } else if (child.children && child.children.length > 0) {
      // has third level children
    } else {
      onSelect(child)
      handleClose()
    }
  }

  function handleToggleFavorite(menu: any) {
    toggleFavorite(menu)
  }

  function handleClose() {
    setSearchKeyword('')
    setSelectedKey('')
    setSelectedMenu(null)
    onClose()
  }

  function handleCustomNav() {
    onOpenCustomNav()
    onClose()
  }

  if (!visible) return null

  return (
    <div className="more-menu-drawer">
      <div className="search-area">
        <div className="search-wrapper">
          <input
            ref={searchInputRef}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="search-input"
            placeholder="请输入关键词搜索应用和菜单"
          />
          <svg className="search-icon" viewBox="0 0 48 48">
            <use href="#search" />
          </svg>
        </div>
        <svg className="close-btn" viewBox="0 0 48 48" onClick={handleClose}>
          <path d="M12 12l24 24M36 12L12 36" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>

      <div className="content-area">
        <div className="menu-left">
          {filteredMenus.map((menu: any) => (
            <div
              key={menu.key}
              className={`menu-item${selectedKey === menu.key ? ' active' : ''}`}
              onClick={() => handleSelect(menu)}
            >
              <svg className="menu-icon" viewBox="0 0 48 48">
                <use href={`#${getIconName(menu.icon)}`} />
              </svg>
              <span className="menu-label">{menu.label}</span>
            </div>
          ))}
          {filteredMenus.length === 0 && <div className="no-data">暂无数据</div>}
          <div className="custom-nav-section">
            <div className="custom-nav-divider" />
            <div className="custom-nav-btn" onClick={handleCustomNav}>
              <svg className="icon" viewBox="0 0 48 48">
                <use href="#setting" />
              </svg>
              <span>自定义导航栏</span>
            </div>
          </div>
        </div>

        <div className="menu-right">
          {selectedMenu ? (
            selectedMenu.children?.map((child: any) => (
              <div key={child.key} className="menu-section">
                <div className="section-title">
                  <div className="title-bar" />
                  <span className="title-text">{child.label}</span>
                </div>
                {child.children && child.children.length > 0 && (
                  <div className="level-3">
                    {child.children.map((grandChild: any) => (
                      <div
                        key={grandChild.key}
                        className="menu-item"
                        onClick={() => handleChildClick(grandChild, child)}
                      >
                        <span className="menu-label">{grandChild.label}</span>
                        <svg
                          className={`star-icon${isFavorited(grandChild.key) ? ' is-favorited' : ''}`}
                          viewBox="0 0 24 24"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            handleToggleFavorite(grandChild)
                          }}
                        >
                          <use href="#star-fill" className="star-fill" />
                          <use href="#star" className="star-outline" />
                        </svg>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-data">请选择左侧菜单</div>
          )}
        </div>
      </div>
    </div>
  )
}
