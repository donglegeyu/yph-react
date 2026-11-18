import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CompanyMultiTabs, CompanyTooltip, SvgIcon } from '@donglegeyu/company-ui'
import type { MultiTabItem, MultiTabSearchOption } from '@donglegeyu/company-ui'
import { useAppStore } from '@/store/app'
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

  const isHome = location.pathname === '/home' || location.pathname === '/'

  useEffect(() => {
    if (isHome) {
      setActiveTabKey('')
    } else {
      const tab = tabs.find((t) => t.path === location.pathname)
      if (tab) {
        setActiveTabKey(tab.key)
        const keys = Object.keys(secondMenusMap)
        if (keys.length > 0) {
          useAppStore.getState().syncMenuState(tab.key, tab.path)
        }
      }
    }
  }, [location.pathname, tabs, setActiveTabKey, isHome, secondMenusMap])

  const getTabLabel = useCallback(
    (key: string, fallback: string, path?: string) => {
      const label = getMenuLabelByKey(key) || (path ? getMenuLabelByPath(path) : null)
      return label || fallback
    },
    [getMenuLabelByKey, getMenuLabelByPath]
  )

  const goHome = useCallback(() => {
    setActiveTabKey('')
    useAppStore.setState({ activeFirstMenu: 'home', activeKey: '', expandedKeys: [], secondSidebarHovered: false })
    navigate('/home')
  }, [navigate, setActiveTabKey])

  const goTab = useCallback(
    (tab: { key: string; path: string }) => {
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

  // 搜索数据源：业务菜单树（一级模块 + 叶子菜单），对齐组件库 AdminLayoutTemplate.collectSearchOptions
  const searchOptions = useMemo<MultiTabSearchOption[]>(() => {
    const list: MultiTabSearchOption[] = []
    const walk = (items: typeof businessMenus) => {
      items.forEach((menu) => {
        list.push({ key: menu.key, label: menu.label, path: menu.path })
        if (menu.children?.length) walk(menu.children as typeof businessMenus)
      })
    }
    walk(businessMenus)
    return list
  }, [businessMenus])

  // 搜索选中：模块级菜单（无 path）只切换一级高亮；叶子菜单开页签导航（对齐 AdminLayoutTemplate.handleMenuClick）
  const handleSearchSelect = useCallback(
    (option: MultiTabSearchOption) => {
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

  const multiTabItems = useMemo<MultiTabItem[]>(
    () =>
      tabs
        .filter((t) => t.key !== 'home')
        .map((tab) => ({
          key: tab.key,
          label: getTabLabel(tab.key, tab.label, tab.path),
          path: tab.path,
        })),
    [tabs, getTabLabel]
  )

  const handleChange = useCallback(
    (key: string, tab: MultiTabItem) => {
      goTab({ key, path: tab.path ?? '' })
    },
    [goTab]
  )

  const handleExtraFullScreen = useCallback(() => {
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()
  }, [])

  return (
    <CompanyMultiTabs
      tabs={multiTabItems}
      activeKey={activeTabKey}
      onChange={handleChange}
      onClose={(key) => handleCloseTab(key)}
      homeTab={{ key: 'home', label: '首页' }}
      isHomeActive={isHome || activeTabKey === ''}
      onHomeClick={goHome}
      searchOptions={searchOptions}
      onSearchSelect={handleSearchSelect}
      extra={
        <>
          <CompanyTooltip title="全屏">
            <SvgIcon href="fullscreen" className="action-icon" onClick={handleExtraFullScreen} />
          </CompanyTooltip>
          <AiAssistantTrigger />
        </>
      }
    />
  )
}
