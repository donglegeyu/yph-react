import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store/app'
import { CompanyTooltip, SvgIcon } from '@donglegeyu/company-ui'
import './TabBar.scss'

export default function TabBar() {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = useAppStore((s) => s.tabs)
  const activeTabKey = useAppStore((s) => s.activeTabKey)
  const setActiveTabKey = useAppStore((s) => s.setActiveTabKey)
  const secondMenusMap = useAppStore((s) => s.secondMenusMap)
  const syncMenuState = useAppStore((s) => s.syncMenuState)
  const getMenuLabelByKey = useAppStore((s) => s.getMenuLabelByKey)
  const getMenuLabelByPath = useAppStore((s) => s.getMenuLabelByPath)

  const [localActiveKey, setLocalActiveKey] = useState(activeTabKey)

  const isHome = location.pathname === '/home' || location.pathname === '/'

  useEffect(() => {
    if (isHome) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalActiveKey('')
      setActiveTabKey('')
    } else {
      const tab = tabs.find((t) => t.path === location.pathname)
      if (tab) {
        setLocalActiveKey(tab.key)
        setActiveTabKey(tab.key)
        const keys = Object.keys(secondMenusMap)
        if (keys.length > 0) {
          useAppStore.getState().syncMenuState(tab.key, tab.path)
        }
      }
    }
  }, [location.pathname, tabs, setActiveTabKey, isHome, secondMenusMap])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalActiveKey(activeTabKey)
  }, [activeTabKey])

  const getTabLabel = useCallback(
    (key: string, fallback: string, path?: string) => {
      const label = getMenuLabelByKey(key) || (path ? getMenuLabelByPath(path) : null)
      return label || fallback
    },
    [getMenuLabelByKey, getMenuLabelByPath]
  )

  const goHome = useCallback(() => {
    setLocalActiveKey('')
    setActiveTabKey('')
    useAppStore.setState({ activeFirstMenu: 'home', activeKey: '', expandedKeys: [], secondSidebarHovered: false })
    navigate('/home')
  }, [navigate, setActiveTabKey])

  const goTab = useCallback(
    (tab: { key: string; path: string }) => {
      setLocalActiveKey(tab.key)
      setActiveTabKey(tab.key)

      const isMenuPath = Object.values(secondMenusMap).some((menus) =>
        menus.some(
          (menu) =>
            menu.path === tab.path ||
            menu.children?.some((child) => child.path === tab.path)
        )
      )

      if (isMenuPath) {
        syncMenuState(tab.key, tab.path)
      } else {
        useAppStore.setState({ activeFirstMenu: '', activeKey: '', expandedKeys: [], secondSidebarHovered: false })
      }

      navigate(tab.path)
    },
    [navigate, secondMenusMap, syncMenuState, setActiveTabKey]
  )

  const handleCloseTab = useCallback(
    (key: string) => {
      const next = useAppStore.getState().closeTab(key)
      if (next) {
        goTab(next)
      }
    },
    [goTab]
  )

  return (
    <div className="tab-bar">
      <div className="tab-list">
        <div
          className={`tab-item home-tab${isHome ? ' active' : ''}`}
          onClick={goHome}
        >
          <span className="tab-label">首页</span>
        </div>
        {tabs
          .filter((t) => t.key !== 'home')
          .map((tab) => (
            <div
              key={tab.key}
              className={`tab-item${localActiveKey === tab.key ? ' active' : ''}`}
              onClick={() => goTab(tab)}
            >
              <span className="tab-label">{getTabLabel(tab.key, tab.label, tab.path)}</span>
              <SvgIcon
                href="close"
                className="tab-close"
                size={12}
                onClick={(e) => {
                  e.stopPropagation()
                  handleCloseTab(tab.key)
                }}
              />
            </div>
          ))}
      </div>
      <div className="tab-actions">
        <CompanyTooltip title="全屏">
          <SvgIcon href="fullscreen" className="action-icon" />
        </CompanyTooltip>
      </div>
    </div>
  )
}
