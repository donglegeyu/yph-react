/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store/app'
import SvgIcon from '@/components/SvgIcon'
import { CompanyPopover } from '@donglegeyu/company-ui'
import MoreMenuDrawer from './MoreMenuDrawer'
import CustomNavPanel from './CustomNavPanel'
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

  const [activeKey, setActiveKey] = useState(() => {
    const path = window.location.pathname
    if (path === '/home') return 'home'
    if (path === '/favorites') return 'favorites'
    return ''
  })
  const [domainPopoverOpen, setDomainPopoverOpen] = useState(false)
  const [domains] = useState<Domain[]>([])
  const [currentDomainId, setCurrentDomainId] = useState<number | null>(null)
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false)
  const [customNavVisible, setCustomNavVisible] = useState(false)

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    const newMenu = useAppStore.getState().activeFirstMenu
    if (newMenu === 'home' || newMenu === 'favorites' || !newMenu) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveKey('')
    } else {
      setActiveKey(newMenu)
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (moreDrawerOpen && !target.closest('.more-menu-drawer') && !target.closest('.business-menu-item')) {
        setMoreDrawerOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [moreDrawerOpen])

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

  const handleOpenCustomNav = useCallback(() => {
    const state = useAppStore.getState()
    if (!state.customNavMenus || state.customNavMenus.length === 0) {
      useAppStore.setState({ customNavMenus: [...displayMenus] })
    }
    setCustomNavVisible(true)
  }, [displayMenus])

  const handleCustomNavUpdate = useCallback((selected: any[]) => {
    useAppStore.setState({ customNavMenus: selected })
    localStorage.setItem('app:customNavMenus', JSON.stringify(selected))
    useAppStore.getState().saveCustomNavMenus(selected)
  }, [])

  const handleThemeSettings = useCallback(() => {
    setActiveKey('')
    useAppStore.getState().setActiveKey('')
    useAppStore.getState().setExpandedKeys([])
    navigate('/component-preview')
  }, [navigate])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('app:userInfo')
    navigate('/login')
  }, [navigate])

  return (
    <>
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
                  onClick={handleThemeSettings}
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
      </div>

      {moreDrawerOpen && (
        <>
          <div className="more-drawer-backdrop" onClick={() => setMoreDrawerOpen(false)} />
          <MoreMenuDrawer
            visible={moreDrawerOpen}
            menus={moreMenus}
            onClose={() => setMoreDrawerOpen(false)}
            onSelect={handleMoreSelect}
            onOpenCustomNav={handleOpenCustomNav}
          />
        </>
      )}

      {customNavVisible && (
        <>
          <div className="more-drawer-backdrop" onClick={() => setCustomNavVisible(false)} />
          <CustomNavPanel
            visible={customNavVisible}
            menus={businessMenus}
            totalCount={visibleMenuCount}
            selectedMenus={customNavMenus}
            onClose={() => setCustomNavVisible(false)}
            onUpdate={handleCustomNavUpdate}
          />
        </>
      )}
    </>
  )
}
