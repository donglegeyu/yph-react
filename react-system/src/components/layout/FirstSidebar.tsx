import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store/app'
import SvgIcon from '@/components/SvgIcon'
import { CompanyPopover } from '@donglegeyu/company-ui'
import type { Domain } from '@/types'
import './FirstSidebar.scss'
import logoImg from '@/assets/logo-dl.svg'

const iconMap: Record<string, string> = {
  commodity: 'tag',
  shopping: 'shopping-cart-add',
  goods: 'tag',
  buy: 'shopping-cart-add',
}

function getIconName(icon?: string): string {
  return icon ? iconMap[icon] || icon : 'id-card-v-klbe0a04'
}

export default function FirstSidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const businessMenus = useAppStore((s) => s.businessMenus)
  const customNavMenus = useAppStore((s) => s.customNavMenus)
  const userInfo = useAppStore((s) => s.userInfo)
  const firstMenus = useAppStore((s) => s.firstMenus)
  const systemBottomMenus = useAppStore((s) => s.systemBottomMenus)
  const selectFirstMenu = useAppStore((s) => s.selectFirstMenu)
  const promoteToNav = useAppStore((s) => s.promoteToNav)

  const [activeKey, setActiveKey] = useState('home')
  const [domainPopoverOpen, setDomainPopoverOpen] = useState(false)
  const [domains] = useState<Domain[]>([])
  const [currentDomainId, setCurrentDomainId] = useState<number | null>(null)
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false)
  const [themeDrawerOpen, setThemeDrawerOpen] = useState(false)
  const [selectedThemeColor, setSelectedThemeColor] = useState(
    localStorage.getItem('theme:color') || '#F95914'
  )

  const currentDomain = useMemo(
    () => domains.find((d) => d.id === currentDomainId),
    [domains, currentDomainId]
  )

  const visibleMenuCount = 6
  const hasMore = businessMenus.length > visibleMenuCount

  const displayMenus = useMemo(() => {
    if (Array.isArray(customNavMenus) && customNavMenus.length > 0) {
      return customNavMenus.slice(0, visibleMenuCount).map((m) => ({
        ...m,
        icon: m.icon || 'id-card-v-klbe0a04',
      }))
    }
    return businessMenus.slice(0, visibleMenuCount).map((m) => ({
      ...m,
      icon: (m as any).icon || 'id-card-v-klbe0a04',
    }))
  }, [businessMenus, customNavMenus, visibleMenuCount])

  const moreMenus = useMemo(() => {
    if (Array.isArray(customNavMenus) && customNavMenus.length > 0) {
      const customKeys = new Map(customNavMenus.map((m, i) => [m.key, i]))
      return [...businessMenus].sort((a, b) => {
        const aIdx = customKeys.get(a.key) ?? Infinity
        const bIdx = customKeys.get(b.key) ?? Infinity
        return aIdx - bIdx
      })
    }
    return businessMenus
  }, [businessMenus, customNavMenus])

  useEffect(() => {
    const appStore = useAppStore.getState()

    const path = location.pathname
    if (path === '/home') {
      setActiveKey('home')
      return
    }
    if (path === '/favorites') {
      setActiveKey('favorites')
      return
    }

    const validKeys = Object.keys(appStore.secondMenusMap)
    if (appStore.activeFirstMenu && validKeys.includes(appStore.activeFirstMenu)) {
      setActiveKey(appStore.activeFirstMenu)
    }
  }, [location.pathname])

  useEffect(() => {
    const appStore = useAppStore.getState()
    const newMenu = appStore.activeFirstMenu
    if (newMenu === 'home' || newMenu === 'favorites' || !newMenu) {
      setActiveKey('')
    } else {
      setActiveKey(newMenu)
    }
  }, [])

  const handleClick = useCallback(
    (menu: any) => {
      if (menu.key === 'home') {
        setActiveKey('home')
        selectFirstMenu('home')
        useAppStore.getState().setActiveKey('')
        useAppStore.getState().setExpandedKeys([])
        navigate('/home')
      } else if (menu.key === 'favorites') {
        setActiveKey('favorites')
        selectFirstMenu('favorites')
        navigate('/favorites')
      } else if (menu.path) {
        setActiveKey(menu.key)
        selectFirstMenu(menu.key)
        useAppStore.getState().setActiveKey('')
        navigate(menu.path)
      } else {
        setActiveKey(menu.key)
        selectFirstMenu(menu.key)
        useAppStore.getState().setActiveKey('')
      }
    },
    [navigate, selectFirstMenu]
  )

  const handleBusinessMenuEnter = useCallback(
    (menu: any) => {
      const appStore = useAppStore.getState()
      if (!appStore.secondSidebarFixed) {
        appStore.setActiveFirstMenu(menu.key)
        useAppStore.getState().cancelHideSidebar()
      }
    },
    []
  )

  const handleBusinessMenuLeave = useCallback(() => {
    useAppStore.getState().delayHideSidebar()
  }, [])

  const handleMoreSelect = useCallback(
    (menu: any) => {
      setActiveKey(menu.key)
      selectFirstMenu(menu.key)
      promoteToNav(menu.key)
      setMoreDrawerOpen(false)
    },
    [selectFirstMenu, promoteToNav]
  )

  const handleThemeColorChange = useCallback((color: string) => {
    setSelectedThemeColor(color)
    localStorage.setItem('theme:color', color)
    window.dispatchEvent(new CustomEvent('theme-color-change', { detail: { color } }))
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('app:userInfo')
    navigate('/login')
  }, [navigate])

  const themeColors = [
    { label: '橙色', value: '#F95914' },
    { label: '蓝色', value: '#1890ff' },
    { label: '绿色', value: '#52c41a' },
    { label: '紫色', value: '#722ed1' },
    { label: '红色', value: '#f5222d' },
    { label: '金黄色', value: '#faad14' },
  ]

  return (
    <div className="first-sidebar">
      <div className="brand-area">
        <CompanyPopover
          open={domainPopoverOpen}
          onOpenChange={setDomainPopoverOpen}
          trigger="click"
          placement="right"
          content={
            <div style={{ width: 180, maxHeight: 300, overflow: 'auto' }}>
              {domains.map((d) => (
                <div
                  key={d.id}
                  className={`domain-popover-item${currentDomainId === d.id ? ' active' : ''}`}
                  onClick={() => {
                    setCurrentDomainId(d.id)
                    localStorage.setItem('currentDomainId', String(d.id))
                    setDomainPopoverOpen(false)
                    useAppStore.getState().fetchMenus()
                  }}
                  style={{
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 12px',
                    cursor: 'pointer',
                    borderRadius: 4,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{d.domainName}</span>
                  {currentDomainId === d.id && <SvgIcon href="check-one" size={16} />}
                </div>
              ))}
            </div>
          }
        >
          <div className="logo-row">
            <div className="logo">
              <img className="logo-icon" src={logoImg} alt="logo" />
            </div>
            <div className="dropdown-icon">
              <SvgIcon href="down-c" size={12} />
            </div>
          </div>
        </CompanyPopover>
        <div className="domain-name">
          <span>{currentDomain?.domainName || '星际造梦'}</span>
        </div>
      </div>

      <div className="system-menu-top">
        {firstMenus.map((menu) => (
          <div
            key={menu.key}
            className={`menu-item menu-item--normal${activeKey === menu.key ? ' active' : ''}`}
            onClick={() => handleClick(menu)}
            onMouseEnter={() => menu.key === 'favorites' && handleBusinessMenuEnter(menu)}
            onMouseLeave={() => menu.key === 'favorites' && handleBusinessMenuLeave()}
          >
            <SvgIcon href={getIconName(menu.icon)} className="menu-icon" />
            <span className="menu-label">{menu.label}</span>
          </div>
        ))}
        {firstMenus.length > 1 && <div className="divider" />}
      </div>

      <div className="business-menus">
        {displayMenus.map((menu: any) => (
          <div
            key={menu.key}
            className={`business-menu-item${activeKey === menu.key ? ' active' : ''}`}
            onClick={() => handleClick(menu)}
            onMouseEnter={() => handleBusinessMenuEnter(menu)}
            onMouseLeave={handleBusinessMenuLeave}
          >
            <SvgIcon href={getIconName(menu.icon)} className="menu-icon" />
            <span className="menu-label">{menu.label}</span>
          </div>
        ))}
        {hasMore && (
          <div
            className="business-menu-item more-btn"
            onClick={() => setMoreDrawerOpen(true)}
          >
            <SvgIcon href="more-two" className="menu-icon" />
            <span className="menu-label">更多</span>
          </div>
        )}
      </div>

      {moreDrawerOpen && (
        <div className="custom-nav-overlay" onClick={() => setMoreDrawerOpen(false)}>
          <div
            className="more-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 600,
              height: 500,
              background: '#fff',
              borderRadius: 8,
              display: 'flex',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: 200,
                borderRight: '1px solid #f0f0f0',
                overflow: 'auto',
                padding: '8px 16px',
              }}
            >
              {moreMenus.map((menu: any) => (
                <div
                  key={menu.key}
                  onClick={() => handleMoreSelect(menu)}
                  style={{
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    borderRadius: 4,
                    padding: '0 16px',
                    color: '#333',
                  }}
                >
                  <SvgIcon href={getIconName(menu.icon)} className="menu-icon" />
                  <span>{menu.label}</span>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
              <div style={{ color: '#999' }}>请选择左侧菜单</div>
            </div>
          </div>
        </div>
      )}

      <div className="system-menu-bottom">
        {systemBottomMenus.length > 0 && <div className="nav-divider" />}
        {systemBottomMenus.map((menu) => (
          <div key={menu.key} className="system-bottom-item" onClick={() => handleClick(menu)}>
            <SvgIcon href={getIconName(menu.icon)} className="menu-icon" />
            <span className="menu-label">{menu.label}</span>
          </div>
        ))}
        <CompanyPopover
          trigger="click"
          placement="rightBottom"
          content={
            <div style={{ width: 160 }}>
              <div
                style={{
                  height: 38,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px 12px',
                  gap: 6,
                  cursor: 'pointer',
                  borderRadius: 4,
                }}
                onClick={() => setThemeDrawerOpen(true)}
              >
                <SvgIcon href="theme" size={20} />
                <span style={{ fontSize: 14 }}>主题设置</span>
              </div>
              <div style={{ height: 1, background: '#f0f0f0', margin: '8px 0' }} />
              <div
                style={{
                  height: 38,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px 12px',
                  gap: 6,
                  cursor: 'pointer',
                  borderRadius: 4,
                }}
                onClick={handleLogout}
              >
                <SvgIcon href="logout" size={20} />
                <span style={{ fontSize: 14 }}>退出登录</span>
              </div>
            </div>
          }
        >
          <div className="person-info">
            <div className="avatar">{userInfo.username?.charAt(0) || 'A'}</div>
            <div className="name">{userInfo.username || 'admin'}</div>
          </div>
        </CompanyPopover>
      </div>

      {themeDrawerOpen && (
        <div className="theme-drawer-overlay" onClick={() => setThemeDrawerOpen(false)}>
          <div className="theme-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="theme-drawer-header">
              <span className="theme-drawer-title">主题设置</span>
              <SvgIcon
                href="close"
                className="theme-drawer-close"
                onClick={() => setThemeDrawerOpen(false)}
              />
            </div>
            <div className="theme-drawer-content">
              <div className="theme-option-group">
                <div className="theme-option-label">主题色</div>
                <div className="theme-colors">
                  {themeColors.map((color) => (
                    <div
                      key={color.value}
                      className={`theme-color-item${selectedThemeColor === color.value ? ' active' : ''}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => handleThemeColorChange(color.value)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
