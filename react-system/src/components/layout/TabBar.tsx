import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store/app'
import { CompanyTooltip, SvgIcon } from '@donglegeyu/company-ui'
import './TabBar.scss'

/** AI 助手页签按钮：对齐组件库 AdminLayoutTemplate 内置的 admin-layout-ai-tab（页签同视觉，排在动作区末尾）；
 * 面板打开后隐藏自身，面板自带关闭入口；开合走 store（与页签/路由解耦），流式期间仅本组件重渲染 */
function AiAssistantTrigger() {
  const aiPanelOpen = useAppStore((s) => s.aiPanelOpen)
  const setAiPanelOpen = useAppStore((s) => s.setAiPanelOpen)
  if (aiPanelOpen) return null
  return (
    <button
      type="button"
      className="ai-assistant-tab"
      aria-label="打开 AI 智能助手面板"
      onClick={() => setAiPanelOpen(true)}
    >
      <SvgIcon name="writing-fluently" size={15} />
      <span>AI 智能助手</span>
    </button>
  )
}

/** 页签栏搜索入口：对齐组件库 CompanyMultiTabs 的 SearchEntry（首页页签左侧，图标按钮 + 搜索面板）；
 * 数据源取业务菜单树（一级模块 + 叶子菜单），选中后走 goTab 同套导航逻辑 */
function TabSearchEntry({ onSelect }: { onSelect: (option: { key: string; label: string; path?: string }) => void }) {
  const businessMenus = useAppStore((s) => s.businessMenus)
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  // 收集业务菜单树可搜索项（一级模块 + 叶子菜单），对齐 AdminLayoutTemplate.collectSearchOptions
  const options = useMemo(() => {
    const list: Array<{ key: string; label: string; path?: string }> = []
    const walk = (items: typeof businessMenus) => {
      items.forEach((menu) => {
        list.push({ key: menu.key, label: menu.label, path: menu.path })
        if (menu.children?.length) walk(menu.children as typeof businessMenus)
      })
    }
    walk(businessMenus)
    return list
  }, [businessMenus])

  const filteredOptions = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    if (!kw) return options
    return options.filter((option) => option.label.toLowerCase().includes(kw))
  }, [options, keyword])

  const handleSelect = useCallback(
    (option: { key: string; label: string; path?: string }) => {
      setOpen(false)
      setKeyword('')
      onSelect(option)
    },
    [onSelect]
  )

  return (
    <div className="tab-search" ref={containerRef}>
      <CompanyTooltip title="搜索" mouseEnterDelay={0.5}>
        <button
          type="button"
          aria-label="搜索"
          className={`tab-search-trigger${open ? ' is-open' : ''}`}
          onClick={() => setOpen((prev) => !prev)}
        >
          <SvgIcon href="search" size={16} />
        </button>
      </CompanyTooltip>
      {open && (
        <div className="tab-search-panel">
          <div className="tab-search-input">
            <input
              autoFocus
              value={keyword}
              placeholder="请输入关键词搜索应用和菜单"
              onChange={(e) => setKeyword(e.target.value)}
            />
            <SvgIcon href="search" size={16} className="tab-search-input-icon" />
          </div>
          <ul className="tab-search-list">
            {filteredOptions.length ? (
              filteredOptions.map((option) => (
                <li key={option.key}>
                  <button
                    type="button"
                    className="tab-search-option"
                    title={option.label}
                    onClick={() => handleSelect(option)}
                  >
                    {option.label}
                  </button>
                </li>
              ))
            ) : (
              <li className="tab-search-empty">暂无匹配结果</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

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
  const businessMenus = useAppStore((s) => s.businessMenus)
  const selectFirstMenu = useAppStore((s) => s.selectFirstMenu)

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

  // 搜索选中：模块级菜单（无 path）只切换一级高亮；叶子菜单开页签导航（对齐 AdminLayoutTemplate.handleMenuClick）
  const handleSearchSelect = useCallback(
    (option: { key: string; label: string; path?: string }) => {
      const menu = businessMenus.find((m) => m.key === option.key)
      if (menu && menu.children?.length) {
        selectFirstMenu(menu.key)
        return
      }
      if (option.path) {
        goTab({ key: option.key, path: option.path })
      }
    },
    [businessMenus, goTab, selectFirstMenu]
  )

  return (
    <div className="tab-bar">
      <TabSearchEntry onSelect={handleSearchSelect} />
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
        <AiAssistantTrigger />
      </div>
    </div>
  )
}
