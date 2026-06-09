import { create } from 'zustand'
import { API_ENDPOINTS } from '@/constants/api'
import type { MenuItem, BusinessMenu, CustomNavMenu, UserInfo, Favorite, NavMenu } from '@/types'

let hideSidebarTimer: ReturnType<typeof setTimeout> | null = null

interface TabItem {
  key: string
  label: string
  path: string
}

interface NavigateResult {
  firstKey: string
  secondMenu: MenuItem | null
  thirdMenu: MenuItem | null
}

interface AppState {
  businessMenus: BusinessMenu[]
  customNavMenus: CustomNavMenu[]
  firstMenus: MenuItem[]
  systemBottomMenus: MenuItem[]
  activeFirstMenu: string
  activeKey: string
  expandedKeys: string[]
  secondMenusMap: Record<string, MenuItem[]>
  favorites: Favorite[]
  userInfo: UserInfo
  tabs: TabItem[]
  activeTabKey: string
  secondSidebarHovered: boolean
  secondSidebarFixed: boolean
  isFirstMenuHovering: boolean

  setActiveFirstMenu: (key: string) => void
  setActiveKey: (key: string) => void
  setExpandedKeys: (keys: string[]) => void
  addExpandedKey: (key: string) => void
  removeExpandedKey: (key: string) => void
  toggleExpandedKey: (key: string) => void
  clearExpandedKeys: () => void
  setUserInfo: (info: UserInfo) => void
  setFavorites: (favorites: Favorite[]) => void
  addFavorite: (menu: MenuItem) => Promise<boolean>
  removeFavorite: (menuKey: string) => Promise<boolean>
  isFavorited: (menuKey: string) => boolean
  toggleFavorite: (menu: MenuItem) => Promise<void>
  saveFavoritesOrder: (items: Favorite[]) => Promise<void>
  openTab: (key: string, label: string, path: string) => void
  closeTab: (key: string) => TabItem | null
  setActiveTabKey: (key: string) => void

  fetchMenus: () => Promise<void>
  fetchFavorites: () => Promise<void>
  fetchCustomNavMenus: () => Promise<void>
  saveCustomNavMenus: (menus: CustomNavMenu[]) => Promise<void>

  navigateToPath: (path: string) => NavigateResult | null
  currentSecondMenus: () => MenuItem[]
  findFirstMenuByTabKey: (tabKey: string) => string | null
  syncMenuState: (tabKey: string, tabPath: string) => void
  promoteToNav: (firstKey: string) => void
  syncCustomNavOrder: (displayOrder: MenuItem[]) => void
  getMenuLabelByKey: (key: string) => string | null
  clearStateForNonMenuPath: () => void
  delayHideSidebar: () => void
  cancelHideSidebar: () => void
  selectFirstMenu: (key: string) => void
  menusLoaded: boolean
  loadSidebarPreference: () => Promise<void>
  saveSidebarPreference: (fixed: boolean) => Promise<void>
  saveCurrentDomainState: () => void
  restoreDomainState: (domainId: number) => void
}

const STORAGE_KEYS = {
  ACTIVE_FIRST_MENU: 'app:activeFirstMenu',
  TABS: 'app:tabs',
  ACTIVE_TAB_KEY: 'app:activeTabKey',
  FAVORITES: 'app:favorites',
  CUSTOM_NAV_MENUS: 'app:customNavMenus',
  USER_INFO: 'app:userInfo',
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key)
    if (val === null) return fallback
    const parsed = JSON.parse(val)
    return parsed
  } catch {
    return fallback
  }
}

const savedTabs = loadFromStorage<TabItem[]>(STORAGE_KEYS.TABS, [])
// 去重：避免 localStorage 中残留重复 tab key
const uniqueTabs = savedTabs.filter(
  (tab, index, arr) => arr.findIndex((t) => t.key === tab.key) === index
)
const savedActiveTabKey = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB_KEY) || ''
const savedFirstMenu = localStorage.getItem(STORAGE_KEYS.ACTIVE_FIRST_MENU) || 'home'
const savedUserInfo = loadFromStorage<UserInfo>(STORAGE_KEYS.USER_INFO, { username: 'admin' })
const savedCustomNavMenus = loadFromStorage<CustomNavMenu[]>(STORAGE_KEYS.CUSTOM_NAV_MENUS, [])
// 去重自定义导航
const uniqueCustomNav = savedCustomNavMenus.filter(
  (m, i, arr) => arr.findIndex((x) => x.key === m.key) === i
)
const savedSecondSidebarFixed = localStorage.getItem('app:secondSidebarFixed')

export const useAppStore = create<AppState>((set, get) => ({
  businessMenus: [],
  customNavMenus: uniqueCustomNav,
  firstMenus: [],
  systemBottomMenus: [],
  activeFirstMenu: savedFirstMenu,
  activeKey: '',
  expandedKeys: [],
  secondMenusMap: {},
  favorites: [],
  userInfo: savedUserInfo,
  tabs: uniqueTabs,
  activeTabKey: savedActiveTabKey,
  secondSidebarHovered: false,
  secondSidebarFixed: savedSecondSidebarFixed !== 'false',
  isFirstMenuHovering: false,
  menusLoaded: false,

  setActiveFirstMenu: (key) => {
    set({ activeFirstMenu: key })
    if (key) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_FIRST_MENU, key)
    }
  },

  setActiveKey: (key) => set({ activeKey: key }),
  setExpandedKeys: (keys) => set({ expandedKeys: keys }),

  addExpandedKey: (key) => {
    const { expandedKeys } = get()
    if (!expandedKeys.includes(key)) {
      set({ expandedKeys: [...expandedKeys, key] })
    }
  },

  removeExpandedKey: (key) => {
    const { expandedKeys } = get()
    set({ expandedKeys: expandedKeys.filter((k) => k !== key) })
  },

  toggleExpandedKey: (key) => {
    const { expandedKeys } = get()
    if (expandedKeys.includes(key)) {
      set({ expandedKeys: expandedKeys.filter((k) => k !== key) })
    } else {
      set({ expandedKeys: [...expandedKeys, key] })
    }
  },

  clearExpandedKeys: () => set({ expandedKeys: [] }),

  setUserInfo: (info) => {
    set({ userInfo: info })
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(info))
  },

  setFavorites: (favorites) => set({ favorites }),

  addFavorite: async (menu) => {
    try {
      const res = await fetch(API_ENDPOINTS.FAVORITES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuKey: menu.key,
          menuLabel: menu.label,
          menuPath: menu.path,
          sort: 0,
        }),
      })
      const json = await res.json()
      if (json.code === 200) {
        await get().fetchFavorites()
        return true
      }
    } catch {
      // fallback
    }
    const state = get()
    const newFav: Favorite = {
      menuKey: menu.key,
      menuLabel: menu.label,
      menuPath: menu.path,
      sort: state.favorites.length,
    }
    const newFavorites = [...state.favorites, newFav]
    set({ favorites: newFavorites })
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(newFavorites))
    return true
  },

  removeFavorite: async (menuKey) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.FAVORITES_MENU}/${menuKey}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.code === 200) {
        await get().fetchFavorites()
        return true
      }
    } catch {
      // fallback
    }
    const state = get()
    const newFavorites = state.favorites.filter((f) => f.menuKey !== menuKey)
    set({ favorites: newFavorites })
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(newFavorites))
    return true
  },

  isFavorited: (menuKey) => {
    return get().favorites.some((f) => f.menuKey === menuKey)
  },

  toggleFavorite: async (menu) => {
    if (get().isFavorited(menu.key)) {
      await get().removeFavorite(menu.key)
    } else {
      await get().addFavorite(menu)
    }
  },

  saveFavoritesOrder: async (items) => {
    try {
      const res = await fetch(API_ENDPOINTS.FAVORITES_SORT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item, index) => ({
            menuKey: item.menuKey,
            sort: index,
          })),
        }),
      })
      const json = await res.json()
      if (json.code === 200) {
        set({ favorites: items })
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(items))
      }
    } catch {
      // fallback
    }
  },

  openTab: (key, label, path) => {
    const { tabs } = get()
    const exists = tabs.find((t) => t.key === key)
    let newTabs: TabItem[]
    if (exists) {
      newTabs = tabs
      set({ activeTabKey: key })
    } else {
      newTabs = [...tabs, { key, label, path }]
      set({ tabs: newTabs, activeTabKey: key })
    }
    localStorage.setItem(STORAGE_KEYS.TABS, JSON.stringify(newTabs))
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB_KEY, key)
  },

  closeTab: (key) => {
    const { tabs, activeTabKey } = get()
    const index = tabs.findIndex((t) => t.key === key)
    if (index === -1) return null
    const newTabs = tabs.filter((t) => t.key !== key)
    let next: TabItem | null = null
    if (activeTabKey === key) {
      next = newTabs[index] || newTabs[index - 1] || null
      if (next) {
        set({ tabs: newTabs, activeTabKey: next.key })
      } else {
        set({ tabs: newTabs })
      }
    } else {
      set({ tabs: newTabs })
    }
    localStorage.setItem(STORAGE_KEYS.TABS, JSON.stringify(newTabs))
    return next
  },

  setActiveTabKey: (key) => {
    set({ activeTabKey: key })
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB_KEY, key)
  },

  selectFirstMenu: (key) => {
    set({ activeFirstMenu: key })
    if (key) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_FIRST_MENU, key)
    }
  },

  fetchMenus: async () => {
    try {
      const currentDomainId = localStorage.getItem('currentDomainId')
      const isDefaultDomain = currentDomainId === '1'

      let domainMenus: NavMenu[] = []
      let systemMenus: NavMenu[] = []

      if (currentDomainId && !isDefaultDomain) {
        const [domainRes, systemRes] = await Promise.all([
          fetch(`${API_ENDPOINTS.NAV_MENUS}?domainId=${currentDomainId}`),
          fetch(API_ENDPOINTS.NAV_MENUS),
        ])
        const domainJson = await domainRes.json()
        const systemJson = await systemRes.json()
        if (domainJson.code === 200 && domainJson.data) {
          domainMenus = domainJson.data as NavMenu[]
        }
        if (systemJson.code === 200 && systemJson.data) {
          systemMenus = (systemJson.data as NavMenu[]).filter(
            (m: NavMenu) => m.menuType?.startsWith('系统菜单')
          )
        }
      } else {
        const res = await fetch(API_ENDPOINTS.NAV_MENUS)
        const json = await res.json()
        if (json.code === 200 && json.data) {
          domainMenus = json.data as NavMenu[]
        }
      }

      const menusRaw = [...systemMenus, ...domainMenus]
      const seenIds = new Set<number>()
      const menus: NavMenu[] = []
      for (const m of menusRaw) {
        if (!seenIds.has(m.id)) {
          seenIds.add(m.id)
          menus.push(m)
        }
      }
      if (menus.length === 0) {
        set({ menusLoaded: true })
        return
      }

      const firstMenus = menus
        .filter((m: NavMenu) => m.menuType === '系统菜单-上' && m.status === 1)
        .map((m: NavMenu) => ({
          key: m.key,
          label: m.label,
          icon: m.icon || 'id-card-v-klbe0a04',
          hasChildren: m.key === 'favorites',
        }))

      const systemBottomMenus = menus
        .filter((m: NavMenu) => m.menuType === '系统菜单-下' && m.status === 1)
        .map((m: NavMenu) => ({
          key: m.key,
          label: m.label,
          icon: m.icon || 'id-card-v-klbe0a04',
          hasChildren: false,
        }))

      const businessMenus = menus
        .filter(
          (m: NavMenu) =>
            m.key !== 'home' &&
            m.key !== 'favorites' &&
            !m.menuType?.startsWith('系统菜单') &&
            m.status === 1 &&
            (!m.parentId || m.parentId === 0)
        )
        .sort((a: NavMenu, b: NavMenu) => (a.sort ?? 0) - (b.sort ?? 0))
        .map((m: NavMenu) => ({
          key: m.key,
          label: m.label,
          icon: m.icon || 'id-card-v-klbe0a04',
          hasChildren: !!(m.children && m.children.length > 0),
          children: m.children || [],
        }))
        .filter((m, i, arr) => !m.key || arr.findIndex((x) => x.key === m.key) === i)

      const secondMenusMap: Record<string, MenuItem[]> = {}
      for (const menu of menus) {
        if (menu.children && menu.children.length > 0 && menu.status === 1) {
          const children = [...menu.children]
            .filter((child: NavMenu) => child.status === 1)
            .sort((a: NavMenu, b: NavMenu) => (a.sort ?? 0) - (b.sort ?? 0))
            .map((child: NavMenu) => ({
              key: child.key || `_group_${child.label}`,
              label: child.label,
              path: child.path,
              icon: child.icon || 'id-card-v-klbe0a04',
              children: (child.children || [])
                .filter((gc: NavMenu) => gc.status === 1)
                .sort((a: NavMenu, b: NavMenu) => (a.sort ?? 0) - (b.sort ?? 0))
                .map((gc: NavMenu) => ({
                  key: gc.key || `_child_${gc.label}`,
                  label: gc.label,
                  path: gc.path,
                  icon: gc.icon,
                }))
                .filter((gc, i, arr) => !gc.key?.startsWith('_child_') || arr.findIndex((x) => x.key === gc.key) === i),
            }))
            .filter((child, i, arr) => !child.key?.startsWith('_group_') || arr.findIndex((x) => x.key === child.key) === i)
          secondMenusMap[menu.key] = children
        }
      }

      set({
        businessMenus,
        firstMenus,
        systemBottomMenus,
        secondMenusMap,
      })

      await get().fetchFavorites()
      await get().fetchCustomNavMenus()

      const { businessMenus: latestBusinessMenus, customNavMenus: currentCustomNav } = get()
      if (currentDomainId) {
        const newCustomNav = latestBusinessMenus.map((m) => ({ ...m, icon: m.icon || 'id-card-v-klbe0a04' }))
        set({ customNavMenus: newCustomNav })
        localStorage.setItem(STORAGE_KEYS.CUSTOM_NAV_MENUS, JSON.stringify(newCustomNav))
      } else if (Array.isArray(currentCustomNav) && currentCustomNav.length > 0) {
        const customKeys = new Set(currentCustomNav.map((m) => m.key))
        const newMenus = latestBusinessMenus.filter((m) => !customKeys.has(m.key))
        if (newMenus.length > 0) {
          const merged = [...currentCustomNav, ...newMenus.map((m) => ({ ...m, icon: m.icon || 'id-card-v-klbe0a04' }))]
          set({ customNavMenus: merged })
          localStorage.setItem(STORAGE_KEYS.CUSTOM_NAV_MENUS, JSON.stringify(merged))
        }
      }
    } catch {
      // API unavailable
    }
    set({ menusLoaded: true })
  },

  fetchFavorites: async () => {
    try {
      const res = await fetch(API_ENDPOINTS.FAVORITES)
      const json = await res.json()
      if (json.code === 200) {
        const data = json.data || []
        const uniqueFavs = data.filter(
          (f: Favorite, i: number, arr: Favorite[]) => arr.findIndex((x) => x.menuKey === f.menuKey) === i
        )
        set({ favorites: uniqueFavs })
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(uniqueFavs))
      }
    } catch {
      const cached = localStorage.getItem(STORAGE_KEYS.FAVORITES)
      if (cached) {
        try {
          set({ favorites: JSON.parse(cached) })
        } catch {
          set({ favorites: [] })
        }
      }
    }
  },

  fetchCustomNavMenus: async () => {
    try {
      const res = await fetch(API_ENDPOINTS.CUSTOM_NAV_MENUS)
      const json = await res.json()
      if (json.code === 200) {
        const menus = (json.data || []).map((m: CustomNavMenu) => ({
          ...m,
          icon: m.icon || 'id-card-v-klbe0a04',
        }))
        set({ customNavMenus: menus })
        localStorage.setItem(STORAGE_KEYS.CUSTOM_NAV_MENUS, JSON.stringify(menus))
      }
    } catch {
      // use cache
    }
  },

  saveCustomNavMenus: async (menus) => {
    try {
      const menusWithIcon = menus.map((m) => ({
        ...m,
        icon: m.icon || 'id-card-v-klbe0a04',
      }))
      await fetch(API_ENDPOINTS.CUSTOM_NAV_MENUS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menus: menusWithIcon }),
      })
      localStorage.setItem(STORAGE_KEYS.CUSTOM_NAV_MENUS, JSON.stringify(menusWithIcon))
    } catch {
      // keep local
    }
  },

  navigateToPath: (path) => {
    const { secondMenusMap } = get()
    if (path === '/favorites') {
      set({ activeFirstMenu: 'favorites' })
      return { firstKey: 'favorites', secondMenu: null, thirdMenu: null }
    }
    for (const [firstKey, seconds] of Object.entries(secondMenusMap)) {
      for (const menu of seconds) {
        if (menu.path === path) {
          set({ activeFirstMenu: firstKey })
          return { firstKey, secondMenu: menu, thirdMenu: null }
        }
        if (menu.children?.length) {
          for (const sub of menu.children) {
            if (sub.path === path) {
              set({ activeFirstMenu: firstKey })
              return { firstKey, secondMenu: menu, thirdMenu: sub }
            }
          }
        }
      }
    }
    return null
  },

  currentSecondMenus: () => {
    const { secondMenusMap, activeFirstMenu } = get()
    return secondMenusMap[activeFirstMenu] || []
  },

  findFirstMenuByTabKey: (tabKey) => {
    if (!tabKey) return null
    const { secondMenusMap } = get()
    for (const [firstKey, seconds] of Object.entries(secondMenusMap)) {
      for (const menu of seconds) {
        if (menu.key === tabKey) return firstKey
        if (menu.children?.length) {
          for (const sub of menu.children) {
            if (sub.key === tabKey) return firstKey
          }
        }
      }
    }
    return null
  },

  syncMenuState: (tabKey, tabPath) => {
    const { secondMenusMap } = get()
    for (const [firstKey, seconds] of Object.entries(secondMenusMap)) {
      for (const menu of seconds) {
        if (menu.path === tabPath || menu.key === tabKey) {
          set({ activeFirstMenu: firstKey, activeKey: menu.key })
          if (menu.children?.length) {
            const state = get()
            if (!state.expandedKeys.includes(menu.key)) {
              set({ expandedKeys: [...state.expandedKeys, menu.key] })
            }
          }
          get().promoteToNav(firstKey)
          return
        }
        if (menu.children?.length) {
          for (const sub of menu.children) {
            if (sub.path === tabPath || sub.key === tabKey) {
              set({ activeFirstMenu: firstKey, activeKey: sub.key })
              const state = get()
              if (!state.expandedKeys.includes(menu.key)) {
                set({ expandedKeys: [...state.expandedKeys, menu.key] })
              }
              get().promoteToNav(firstKey)
              return
            }
          }
        }
      }
    }
    set({ activeFirstMenu: 'home', activeKey: '', expandedKeys: [], secondSidebarHovered: false })
  },

  promoteToNav: (firstKey) => {
    const { businessMenus, customNavMenus } = get()
    const menu = businessMenus.find((m) => m.key === firstKey)
    if (!menu) return
    const maxVisible = 6
    const navList =
      Array.isArray(customNavMenus) && customNavMenus.length > 0
        ? [...customNavMenus]
        : (businessMenus.slice(0, maxVisible) as unknown as CustomNavMenu[])
    if (navList.some((m) => m.key === firstKey)) return
    if (navList.length >= maxVisible) {
      navList.shift()
    }
    navList.push(menu as unknown as CustomNavMenu)
    set({ customNavMenus: navList })
    localStorage.setItem(STORAGE_KEYS.CUSTOM_NAV_MENUS, JSON.stringify(navList))
  },

  syncCustomNavOrder: (displayOrder) => {
    const { customNavMenus } = get()
    if (!Array.isArray(customNavMenus)) return
    const displayKeys = displayOrder.map((m) => m.key)
    const sorted = [...customNavMenus].sort((a, b) => {
      const idxA = displayKeys.indexOf(a.key)
      const idxB = displayKeys.indexOf(b.key)
      if (idxA === -1) return 1
      if (idxB === -1) return -1
      return idxA - idxB
    })
    set({ customNavMenus: sorted })
  },

  getMenuLabelByKey: (key) => {
    const { firstMenus, secondMenusMap } = get()
    const firstMenu = firstMenus.find((m) => m.key === key)
    if (firstMenu) return firstMenu.label
    for (const seconds of Object.values(secondMenusMap)) {
      const secondMenu = seconds.find((m) => m.key === key)
      if (secondMenu) return secondMenu.label
      for (const menu of seconds) {
        if (menu.children?.length) {
          const thirdMenu = menu.children.find((m) => m.key === key)
          if (thirdMenu) return thirdMenu.label
        }
      }
    }
    return null
  },

  clearStateForNonMenuPath: () => {
    const { secondMenusMap } = get()
    const currentPath = window.location.pathname
    if (currentPath === '/home' || currentPath === '/') return
    const isMenuPath = Object.values(secondMenusMap).some((menus) =>
      menus.some(
        (menu) =>
          menu.path === currentPath ||
          menu.children?.some((child) => child.path === currentPath)
      )
    )
    if (!isMenuPath) {
      set({
        activeFirstMenu: '',
        activeKey: '',
        expandedKeys: [],
        secondSidebarHovered: false,
      })
    }
  },

  delayHideSidebar: () => {
    if (hideSidebarTimer) clearTimeout(hideSidebarTimer)
    hideSidebarTimer = setTimeout(() => {
      set({ secondSidebarHovered: false })
    }, 100)
  },

  cancelHideSidebar: () => {
    if (hideSidebarTimer) {
      clearTimeout(hideSidebarTimer)
      hideSidebarTimer = null
    }
    set({ secondSidebarHovered: true })
  },

  loadSidebarPreference: async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.USER_PREFERENCES}?key=sidebarFixed`)
      const json = await res.json()
      if (json.code === 200 && json.data !== null) {
        const fixed = json.data === 'true'
        set({ secondSidebarFixed: fixed })
        localStorage.setItem('app:secondSidebarFixed', String(fixed))
      }
    } catch {
      // fallback to localStorage
    }
  },

  saveSidebarPreference: async (fixed) => {
    try {
      await fetch(API_ENDPOINTS.USER_PREFERENCES, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'sidebarFixed', value: String(fixed) }),
      })
    } catch {
      // silently fail
    }
  },

  saveCurrentDomainState: () => {
    const currentDomainId = localStorage.getItem('currentDomainId')
    if (!currentDomainId) return
    const state = get()
    const domainState = {
      tabs: state.tabs,
      activeTabKey: state.activeTabKey,
      activeFirstMenu: state.activeFirstMenu,
      activeKey: state.activeKey,
      expandedKeys: state.expandedKeys,
    }
    localStorage.setItem(`app:domainState:${currentDomainId}`, JSON.stringify(domainState))
  },

  restoreDomainState: (domainId: number) => {
    const saved = localStorage.getItem(`app:domainState:${domainId}`)
    if (saved) {
      try {
        const domainState = JSON.parse(saved)
        set({
          tabs: domainState.tabs || [],
          activeTabKey: domainState.activeTabKey || '',
          activeFirstMenu: domainState.activeFirstMenu || 'home',
          activeKey: domainState.activeKey || '',
          expandedKeys: domainState.expandedKeys || [],
          secondSidebarHovered: false,
        })
        localStorage.setItem(STORAGE_KEYS.TABS, JSON.stringify(domainState.tabs || []))
        localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB_KEY, domainState.activeTabKey || '')
        localStorage.setItem(STORAGE_KEYS.ACTIVE_FIRST_MENU, domainState.activeFirstMenu || 'home')
      } catch {
        set({
          tabs: [],
          activeTabKey: '',
          activeFirstMenu: 'home',
          activeKey: '',
          expandedKeys: [],
          secondSidebarHovered: false,
        })
      }
    } else {
      set({
        tabs: [],
        activeTabKey: '',
        activeFirstMenu: 'home',
        activeKey: '',
        expandedKeys: [],
        secondSidebarHovered: false,
      })
      localStorage.setItem(STORAGE_KEYS.TABS, JSON.stringify([]))
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB_KEY, '')
      localStorage.setItem(STORAGE_KEYS.ACTIVE_FIRST_MENU, 'home')
    }
  },
}))
