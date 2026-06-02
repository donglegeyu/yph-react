import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/app'
import SvgIcon from '@/components/SvgIcon'
import './SecondSidebar.scss'
import nullSvg from '@/assets/null.svg'

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

const hideKeys = ['system-settings', 'component-preview']

interface FavoritesItem {
  key: string
  label: string
  path: string
}

export default function SecondSidebar() {
  const navigate = useNavigate()

  const activeFirstMenu = useAppStore((s) => s.activeFirstMenu)
  const activeKey = useAppStore((s) => s.activeKey)
  const secondSidebarHovered = useAppStore((s) => s.secondSidebarHovered)
  const secondSidebarFixed = useAppStore((s) => s.secondSidebarFixed)
  const favorites = useAppStore((s) => s.favorites)
  const expandedKeys = useAppStore((s) => s.expandedKeys)
  const secondMenusMap = useAppStore((s) => s.secondMenusMap)
  const isFavorited = useAppStore((s) => s.isFavorited)
  const addExpandedKey = useAppStore((s) => s.addExpandedKey)
  const toggleExpandedKey = useAppStore((s) => s.toggleExpandedKey)
  const cancelHideSidebar = useAppStore((s) => s.cancelHideSidebar)
  const delayHideSidebar = useAppStore((s) => s.delayHideSidebar)
  const openTab = useAppStore((s) => s.openTab)
  const toggleFavorite = useAppStore((s) => s.toggleFavorite)
  const navigateToPath = useAppStore((s) => s.navigateToPath)

  const [localExpandedKeys, setLocalExpandedKeys] = useState<string[]>(expandedKeys)
  const [localActiveKey, setLocalActiveKey] = useState(activeKey)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [favoritesList, setFavoritesList] = useState<FavoritesItem[]>([])

  const currentSecondMenus = useMemo(() => {
    return secondMenusMap[activeFirstMenu] || []
  }, [secondMenusMap, activeFirstMenu])

  const showSecondSidebar = useMemo(() => {
    if (!activeFirstMenu || activeFirstMenu === 'home') return false
    return secondSidebarHovered || secondSidebarFixed
  }, [activeFirstMenu, secondSidebarHovered, secondSidebarFixed])

  const secondMenus = useMemo(() => {
    if (activeFirstMenu === 'favorites') {
      return (favorites || []).map((item: Record<string, unknown>) => ({
        key: item.menuKey || item.key || item.id,
        label: item.menuLabel || item.label || item.name || item.title || '未命名',
        path: item.menuPath || item.path || `/menu/${item.menuKey || item.key}`,
      }))
    }
    return currentSecondMenus
      .filter((menu) => !hideKeys.includes(menu.key) && !hideKeys.includes(menu.menuKey))
      .map((menu) => ({
        ...menu,
        icon: menu.icon || 'id-card-v-klbe0a04',
      }))
  }, [activeFirstMenu, favorites, currentSecondMenus])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalExpandedKeys(expandedKeys)
  }, [expandedKeys])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalActiveKey(activeKey)
  }, [activeKey])

  useEffect(() => {
    if (activeFirstMenu === 'favorites') {
      const mapped = (favorites || []).map((item: Record<string, unknown>) => ({
        key: (item.menuKey || item.key || item.id) as string,
        label: (item.menuLabel || item.label || item.name || item.title || '未命名') as string,
        path: (item.menuPath || item.path || `/menu/${item.menuKey || item.key}`) as string,
      }))
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFavoritesList(mapped)
    }
  }, [activeFirstMenu, favorites])

  const handleClick = useCallback(
    (menu: Record<string, unknown>) => {
      if (menu.path) {
        navigateToPath(menu.path)
        openTab(menu.key, menu.label, menu.path)
        setLocalActiveKey(menu.key)
        if (menu.children?.length) {
          addExpandedKey(menu.key)
        } else {
          const parent = currentSecondMenus.find((m) =>
            m.children?.some((c) => c.key === menu.key)
          )
          if (parent) {
            addExpandedKey(parent.key)
          }
        }
        navigate(menu.path)
      }
      if (!secondSidebarFixed) {
        delayHideSidebar()
      }
    },
    [navigateToPath, openTab, addExpandedKey, currentSecondMenus, secondSidebarFixed, delayHideSidebar, navigate]
  )

  const handleToggleFavorite = useCallback(
    async (menu: Record<string, unknown>) => {
      await toggleFavorite(menu)
    },
    [toggleFavorite]
  )

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return
    const newList = [...favoritesList]
    const [removed] = newList.splice(draggedIndex, 1)
    newList.splice(index, 0, removed)
    setFavoritesList(newList)
    setDraggedIndex(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div
      className={`second-sidebar${secondSidebarFixed ? ' is-fixed' : ''}`}
      style={{
        position: !secondSidebarFixed && showSecondSidebar ? 'fixed' : 'relative',
        left: !secondSidebarFixed && showSecondSidebar ? '126px' : '0',
        display: showSecondSidebar ? 'flex' : 'none',
      }}
    >
      <div className="menu-list" onMouseEnter={cancelHideSidebar} onMouseLeave={delayHideSidebar}>
        {activeFirstMenu === 'favorites'
          ? favoritesList.map((element, index) => (
              <div
                key={element.key}
                className={`menu-item single${localActiveKey === element.key ? ' active' : ''}`}
                onClick={() => handleClick(element)}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDrop={() => handleDrop(index)}
                onDragOver={handleDragOver}
              >
                <SvgIcon href="drag" className="drag-handle" />
                <span className="menu-label">{element.label}</span>
                <SvgIcon
                  href="star-fill"
                  className={`favorite-icon favorited${localActiveKey === element.key ? ' active' : ''}`}
                  size={14}
                  onClick={(e) => {
                    e.stopPropagation()
                    useAppStore.getState().removeFavorite(element.key)
                  }}
                />
              </div>
            ))
          : secondMenus.map((menu: Record<string, unknown>) =>
              (menu.children as Record<string, unknown>[])?.length ? (
                <div key={menu.key} className="menu-group">
                  <div
                    className={`menu-item parent${localExpandedKeys.includes(menu.key) ? ' expanded' : ''}`}
                    onClick={() => toggleExpandedKey(menu.key)}
                  >
                    <SvgIcon href={getIconName(menu.icon)} className="menu-icon" />
                    <span className="menu-label">{menu.label}</span>
                    <SvgIcon
                      href="down"
                      className={`expand-icon${localExpandedKeys.includes(menu.key) ? ' rotated' : ''}`}
                    />
                  </div>
                  <div
                    className="sub-menu"
                    style={{ display: localExpandedKeys.includes(menu.key) ? 'flex' : 'none' }}
                  >
                    {(menu.children as Record<string, unknown>[]).map((sub) => (
                      <div
                        key={sub.key}
                        className={`menu-item child${localActiveKey === sub.key ? ' active' : ''}`}
                        onClick={() => handleClick(sub)}
                      >
                        <span className="menu-label">{sub.label}</span>
                        <SvgIcon
                          href={isFavorited(sub.key) ? 'star-fill' : 'star'}
                          className={`favorite-icon${isFavorited(sub.key) ? ' favorited' : ''}`}
                          size={14}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleFavorite(sub)
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  key={menu.key}
                  className={`menu-item single${localActiveKey === menu.key ? ' active' : ''}`}
                  onClick={() => handleClick(menu)}
                >
                  <SvgIcon href={getIconName(menu.icon)} className="menu-icon" />
                  <span className="menu-label">{menu.label}</span>
                  <SvgIcon
                    href={isFavorited(menu.key) ? 'star-fill' : 'star'}
                    className={`favorite-icon${isFavorited(menu.key) ? ' favorited' : ''}`}
                    size={14}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleFavorite(menu)
                    }}
                  />
                </div>
              )
            )}

        {activeFirstMenu === 'favorites' && favoritesList.length === 0 && (
          <div className="empty-tip">
            <img src={nullSvg} className="empty-img" alt="暂无收藏" />
            <span>暂无收藏</span>
          </div>
        )}
        {activeFirstMenu !== 'favorites' && secondMenus.length === 0 && (
          <div className="empty-tip">
            <img src={nullSvg} className="empty-img" alt="暂无菜单" />
            <span>暂无菜单</span>
          </div>
        )}
      </div>

      <div className="collapse-container">
        <div className="collapse-divider" />
        <div
          className="collapse-btn"
          onClick={() => {
            const current = useAppStore.getState().secondSidebarFixed
            useAppStore.setState({ secondSidebarFixed: !current })
          }}
          onMouseEnter={cancelHideSidebar}
          onMouseLeave={delayHideSidebar}
        >
          <SvgIcon href={secondSidebarFixed ? 'pin' : 'pushpin'} className="collapse-icon" />
          <span>{secondSidebarFixed ? '悬浮菜单' : '固定菜单'}</span>
        </div>
      </div>
    </div>
  )
}
