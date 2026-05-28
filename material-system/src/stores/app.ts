import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { API_ENDPOINTS } from '@/constants/api'

interface MenuItem {
  key: string
  label: string
  path?: string
  icon?: string
  children?: MenuItem[]
  hasChildren?: boolean
  menuType?: string
  status?: number
}

interface BusinessMenu extends MenuItem {
  hasChildren: boolean
  children: MenuItem[]
}

interface Favorite {
  menuKey: string
  menuLabel: string
  menuPath?: string
  sort?: number
}

interface CustomNavMenu {
  key: string
  label: string
  path?: string
  icon?: string
  [key: string]: unknown
}

interface NavMenu {
  key: string
  label: string
  path?: string
  icon?: string
  menuType?: string
  status?: number
  children?: NavMenu[]
  hasChildren?: boolean
}

const STORAGE_KEYS = {
  ACTIVE_FIRST_MENU: 'app:activeFirstMenu',
  TABS: 'app:tabs',
  ACTIVE_TAB_KEY: 'app:activeTabKey',
  FAVORITES: 'app:favorites',
  CUSTOM_NAV_MENUS: 'app:customNavMenus',
  USER_INFO: 'app:userInfo',
}

export const useAppStore = defineStore('app', () => {
  const savedFirstMenu = localStorage.getItem(STORAGE_KEYS.ACTIVE_FIRST_MENU) || 'home'
  const savedTabs = localStorage.getItem(STORAGE_KEYS.TABS)
  const savedActiveTabKey = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB_KEY) || ''
  const savedSecondSidebarFixed = localStorage.getItem('app:secondSidebarFixed')

  const activeFirstMenu = ref(savedFirstMenu)
  const activeSecondMenu = ref('')
  const activeKey = ref('')
  const expandedKeys = ref<string[]>([])

  function addExpandedKey(key: string) {
    if (!expandedKeys.value.includes(key)) {
      expandedKeys.value.push(key)
    }
  }

  function removeExpandedKey(key: string) {
    const index = expandedKeys.value.indexOf(key)
    if (index > -1) {
      expandedKeys.value.splice(index, 1)
    }
  }

  function toggleExpandedKey(key: string) {
    if (expandedKeys.value.includes(key)) {
      removeExpandedKey(key)
    } else {
      addExpandedKey(key)
    }
  }

  function clearExpandedKeys() {
    expandedKeys.value = []
  }

  const collapsed = ref(false)
  const secondSidebarHovered = ref(false)
  const secondSidebarFixed = ref(savedSecondSidebarFixed !== 'false')
  const isFirstMenuHovering = ref(false)
  let hideSidebarTimer: ReturnType<typeof setTimeout> | null = null

  function delayHideSidebar() {
    hideSidebarTimer = setTimeout(() => {
      secondSidebarHovered.value = false
    }, 100)
  }

  function cancelHideSidebar() {
    if (hideSidebarTimer) {
      clearTimeout(hideSidebarTimer)
      hideSidebarTimer = null
    }
    secondSidebarHovered.value = true
  }

  const firstMenus = ref<MenuItem[]>([])
  const systemBottomMenus = ref<MenuItem[]>([])
  const businessMenus = ref<BusinessMenu[]>([])
  const secondMenusMap = ref<Record<string, MenuItem[]>>({})
  const favorites = ref<Favorite[]>([])

  const savedCustomNavMenus = localStorage.getItem(STORAGE_KEYS.CUSTOM_NAV_MENUS)
  let parsedCustomNavMenus: CustomNavMenu[] = []
  if (savedCustomNavMenus) {
    try {
      const parsed = JSON.parse(savedCustomNavMenus)
      parsedCustomNavMenus = Array.isArray(parsed) ? parsed as CustomNavMenu[] : []
    } catch {
      parsedCustomNavMenus = []
    }
  }
  const customNavMenus = ref<CustomNavMenu[]>(parsedCustomNavMenus)

  const savedUserInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO)
  const userInfo = ref<{ username: string; role?: string }>(
    savedUserInfo ? JSON.parse(savedUserInfo) : { username: 'admin' }
  )

  function setUserInfo(username: string, role?: string) {
    userInfo.value = { username, role }
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo.value))
  }

  async function fetchFavorites() {
    try {
      const res = await fetch(API_ENDPOINTS.FAVORITES)
      const json = await res.json()
      console.log('[fetchFavorites] response:', json)
      if (json.code === 200) {
        favorites.value = json.data || []
        console.log('[fetchFavorites] favorites:', favorites.value)
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(json.data || []))
      } else {
        console.error('[fetchFavorites] error:', json)
      }
    } catch (e) {
      console.error('[fetchFavorites] exception:', e)
      const cached = localStorage.getItem(STORAGE_KEYS.FAVORITES)
      if (cached) {
        try {
          favorites.value = JSON.parse(cached)
          console.log('[fetchFavorites] loaded from cache:', favorites.value)
        } catch {
          favorites.value = []
        }
      }
    }
  }

  async function fetchCustomNavMenus() {
    try {
      const res = await fetch(API_ENDPOINTS.CUSTOM_NAV_MENUS)
      const json = await res.json()
      if (json.code === 200) {
        const menus = (json.data || []).map((m: CustomNavMenu) => ({
          ...m,
          icon: m.icon || 'id-card-v-klbe0a04',
        }))
        customNavMenus.value = menus
        localStorage.setItem(STORAGE_KEYS.CUSTOM_NAV_MENUS, JSON.stringify(menus))
      }
    } catch {
      // API 不存在时使用本地缓存
    }
  }

  async function saveCustomNavMenus(menus: CustomNavMenu[]) {
    try {
      const menusWithIcon = menus.map((m: CustomNavMenu) => ({
        ...m,
        icon: m.icon || 'id-card-v-klbe0a04',
      }))
      const res = await fetch(API_ENDPOINTS.CUSTOM_NAV_MENUS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menus: menusWithIcon }),
      })
      const json = await res.json()
      if (json.code === 200) {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_NAV_MENUS, JSON.stringify(menusWithIcon))
      }
    } catch {
      // API 不存在时使用本地缓存
    }
  }

  async function addFavorite(menu: MenuItem) {
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
      console.log('[addFavorite] response:', json)
      if (json.code === 200) {
        await fetchFavorites()
        return true
      } else {
        console.error('[addFavorite] error:', json)
      }
    } catch (e) {
      console.error('[addFavorite] exception:', e)
    }
    
    const newFavorite = {
      menuKey: menu.key,
      menuLabel: menu.label,
      menuPath: menu.path,
      sort: favorites.value.length,
    }
    favorites.value = [...favorites.value, newFavorite]
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites.value))
    return true
  }

  async function removeFavorite(menuKey: string) {
    try {
      const res = await fetch(`${API_ENDPOINTS.FAVORITES_MENU}/${menuKey}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.code === 200) {
        await fetchFavorites()
        return true
      }
    } catch {
      // API 失败时使用本地收藏逻辑
    }
    
    favorites.value = favorites.value.filter(f => f.menuKey !== menuKey)
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites.value))
    return true
  }

  function isFavorited(menuKey: string): boolean {
    return favorites.value.some(f => f.menuKey === menuKey)
  }

  async function toggleFavorite(menu: MenuItem) {
    if (isFavorited(menu.key)) {
      await removeFavorite(menu.key)
    } else {
      await addFavorite(menu)
    }
  }

  async function saveFavoritesOrder(items: Favorite[]) {
    try {
      const res = await fetch(API_ENDPOINTS.FAVORITES_SORT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map((item, index) => ({
          menuKey: item.menuKey,
          sort: index,
        })) }),
      })
      const json = await res.json()
      if (json.code === 200) {
        favorites.value = items
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(items))
      }
    } catch {
      // API 不存在时使用本地缓存
    }
  }

  let menusLoaded = false
  
  async function fetchMenus(forceRefresh = false) {
    if (!forceRefresh && menusLoaded && businessMenus.value.length > 0) {
      console.log('[fetchMenus] already loaded, still checking non-menu path')
      // 即使菜单已加载，仍检查非菜单路径
      clearStateForNonMenuPath()
      return
    }
    try {
      // 获取当前域ID
      const currentDomainId = localStorage.getItem('currentDomainId')
      const url = currentDomainId 
        ? `${API_ENDPOINTS.NAV_MENUS}?domainId=${currentDomainId}`
        : API_ENDPOINTS.NAV_MENUS
      
      const res = await fetch(url)
      const json = await res.json()
      if (json.code === 200 && json.data && json.data.length > 0) {
        menusLoaded = true
        const menus = json.data as NavMenu[]
        
        firstMenus.value = menus
          .filter((m: NavMenu) => m.menuType === '系统菜单-上' && m.status === 1)
          .map((m: NavMenu) => ({
            key: m.key,
            label: m.label,
            icon: m.icon || 'id-card-v-klbe0a04',
            hasChildren: m.key === 'favorites',
          }))

        systemBottomMenus.value = menus
          .filter((m: NavMenu) => m.menuType === '系统菜单-下' && m.status === 1)
          .map((m: NavMenu) => ({
            key: m.key,
            label: m.label,
            icon: m.icon || 'id-card-v-klbe0a04',
            hasChildren: false,
          }))

        businessMenus.value = menus
          .filter((m: NavMenu) => m.key !== 'home' && m.key !== 'favorites' && !m.menuType?.startsWith('系统菜单') && m.status === 1)
          .map((m: NavMenu) => ({
            key: m.key,
            label: m.label,
            icon: m.icon || 'id-card-v-klbe0a04',
            hasChildren: !!(m.children && m.children.length > 0),
            children: m.children || [],
          }))

        const newSecondMenusMap: Record<string, MenuItem[]> = {}
        const menuPaths: { path: string; key: string; label: string }[] = []

        for (const menu of menus) {
          if (menu.children && menu.children.length > 0 && menu.status === 1) {
            newSecondMenusMap[menu.key] = menu.children
              .filter((child: NavMenu) => child.status === 1)
              .map((child: NavMenu) => {
                if (child.path) {
                  menuPaths.push({ path: child.path, key: child.key, label: child.label })
                }
                return {
                  key: child.key,
                  label: child.label,
                  path: child.path,
                  icon: child.icon || 'id-card-v-klbe0a04',
                  children: (child.children || [])
                    .filter((grandChild: NavMenu) => grandChild.status === 1)
                    .map((grandChild: NavMenu) => {
                      if (grandChild.path) {
                        menuPaths.push({ path: grandChild.path, key: grandChild.key, label: grandChild.label })
                      }
                      return {
                        key: grandChild.key,
                        label: grandChild.label,
                        path: grandChild.path,
                        icon: grandChild.icon,
                      }
                    }),
                }
              })
          }
        }
        secondMenusMap.value = newSecondMenusMap

        await fetchFavorites()
        await fetchCustomNavMenus()
        await fetchSecondSidebarFixed()
      }
    } catch {
      // API 不存在时使用本地缓存
    }

    // 无论 API 成功还是失败，都检查并清空非菜单路径状态
    clearStateForNonMenuPath()
  }

  // 检查并清空非菜单路径的状态
  function clearStateForNonMenuPath() {
    const currentPath = window.location.pathname

    if (currentPath === '/home' || currentPath === '/') {
      return
    }

    // 检测当前路由是否在菜单配置中
    const isMenuPath = Object.values(secondMenusMap.value).some(menus =>
      menus.some(menu => menu.path === currentPath ||
        menu.children?.some(child => child.path === currentPath))
    )

    // 非菜单路径，清空状态
    if (!isMenuPath) {
      activeFirstMenu.value = ''
      activeKey.value = ''
      clearExpandedKeys()
      secondSidebarHovered.value = false
    }
  }

  function navigateToPath(path: string) {
    console.log('[navigateToPath] path:', path, 'secondMenusMap keys:', Object.keys(secondMenusMap.value), 'current activeFirstMenu:', activeFirstMenu.value)
    
    if (path === '/favorites') {
      console.log('[navigateToPath] handling favorites path, setting activeFirstMenu to favorites')
      activeFirstMenu.value = 'favorites'
      console.log('[navigateToPath] after setting, activeFirstMenu:', activeFirstMenu.value)
      return { firstKey: 'favorites', secondMenu: null, thirdMenu: null }
    }
    
    for (const [firstKey, seconds] of Object.entries(secondMenusMap.value)) {
      for (const menu of seconds) {
        if (menu.path === path) {
          console.log('[navigateToPath] matched second menu, setting activeFirstMenu to:', firstKey)
          activeFirstMenu.value = firstKey
          return { firstKey, secondMenu: menu, thirdMenu: null }
        }
        if (menu.children?.length) {
          for (const sub of menu.children) {
            if (sub.path === path) {
              console.log('[navigateToPath] matched third menu, setting activeFirstMenu to:', firstKey)
              activeFirstMenu.value = firstKey
              return { firstKey, secondMenu: menu, thirdMenu: sub }
            }
          }
        }
      }
    }
    return null
  }

  const currentSecondMenus = computed(() => {
    return secondMenusMap.value[activeFirstMenu.value] || []
  })

  const tabs = ref<Array<{ key: string; label: string; path: string }>>(
    savedTabs ? JSON.parse(savedTabs) : []
  )

  const activeTabKey = ref(savedActiveTabKey)

  function openTab(key: string, label: string, path: string) {
    const exists = tabs.value.find(t => t.key === key)
    if (exists) {
      activeTabKey.value = key
    } else {
      tabs.value.push({ key, label, path })
      activeTabKey.value = key
    }
  }

  function closeTab(key: string) {
    const index = tabs.value.findIndex(t => t.key === key)
    if (index === -1) return null
    tabs.value.splice(index, 1)
    if (activeTabKey.value === key) {
      const next = tabs.value[index] || tabs.value[index - 1] || null
      if (next) activeTabKey.value = next.key
      return next
    }
    return null
  }

  function selectFirstMenu(key: string) {
    activeFirstMenu.value = key
  }

  function findFirstMenuByTabKey(tabKey: string): string | null {
    if (!tabKey) return null
    for (const [firstKey, seconds] of Object.entries(secondMenusMap.value)) {
      for (const menu of seconds) {
        if (menu.key === tabKey) {
          return firstKey
        }
        if (menu.children?.length) {
          for (const sub of menu.children) {
            if (sub.key === tabKey) {
              return firstKey
            }
          }
        }
      }
    }
    const firstPart = tabKey.split('-')[0]
    const possibleKeys = Object.keys(secondMenusMap.value)
    const match = possibleKeys.find(k => k.startsWith(firstPart) || firstPart.startsWith(k.split('-')[0]))
    return match || null
  }

  function promoteToNav(firstKey: string) {
    const menu = businessMenus.value.find((m: BusinessMenu) => m.key === firstKey)
    if (!menu) return
    const maxVisible = 6
    let navList = Array.isArray(customNavMenus.value) && customNavMenus.value.length > 0
      ? [...customNavMenus.value]
      : businessMenus.value.slice(0, maxVisible) as unknown as CustomNavMenu[]
    if (navList.some((m: CustomNavMenu) => m.key === firstKey)) return
    if (navList.length >= maxVisible) {
      navList.shift()
    }
    navList.push(menu as unknown as CustomNavMenu)
    customNavMenus.value = navList
  }

  function syncCustomNavOrder(displayOrder: MenuItem[]) {
    if (!Array.isArray(customNavMenus.value)) return
    const displayKeys = displayOrder.map((m: MenuItem) => m.key)
    const navList = [...customNavMenus.value]
    navList.sort((a: CustomNavMenu, b: CustomNavMenu) => {
      const idxA = displayKeys.indexOf(a.key)
      const idxB = displayKeys.indexOf(b.key)
      if (idxA === -1 && idxB === -1) return 0
      if (idxA === -1) return 1
      if (idxB === -1) return -1
      return idxA - idxB
    })
    customNavMenus.value = navList
  }

  function syncMenuState(tabKey: string, tabPath: string) {
    for (const [firstKey, seconds] of Object.entries(secondMenusMap.value)) {
      for (const menu of seconds) {
        if (menu.path === tabPath || menu.key === tabKey) {
          activeFirstMenu.value = firstKey
          activeKey.value = menu.key
          if (menu.children?.length) {
            addExpandedKey(menu.key)
          }
          promoteToNav(firstKey)
          return
        }
        if (menu.children?.length) {
          for (const sub of menu.children) {
            if (sub.path === tabPath || sub.key === tabKey) {
              activeFirstMenu.value = firstKey
              activeKey.value = sub.key
              addExpandedKey(menu.key)
              promoteToNav(firstKey)
              return
            }
          }
        }
      }
    }
    // 非菜单路径，清空状态，并设置为 'home' 以便触发 FirstSidebar 的 watch
    activeFirstMenu.value = 'home'
    activeKey.value = ''
    clearExpandedKeys()
    secondSidebarHovered.value = false
  }

  function getMenuLabelByKey(key: string): string | null {
    const firstMenu = firstMenus.value.find(m => m.key === key)
    if (firstMenu) return firstMenu.label
    for (const seconds of Object.values(secondMenusMap.value)) {
      const secondMenu = seconds.find(m => m.key === key)
      if (secondMenu) return secondMenu.label
      for (const menu of seconds) {
        if (menu.children?.length) {
          const thirdMenu = menu.children.find(m => m.key === key)
          if (thirdMenu) return thirdMenu.label
        }
      }
    }
    return null
  }

  watch(activeFirstMenu, (val) => {
    if (val) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_FIRST_MENU, val)
    }
  })

  watch(tabs, (val) => {
    localStorage.setItem(STORAGE_KEYS.TABS, JSON.stringify(val))
  }, { deep: true })

  watch(activeTabKey, (val) => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB_KEY, val)
  })

  watch(customNavMenus, (val) => {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_NAV_MENUS, JSON.stringify(val))
    saveCustomNavMenus(val)
  }, { deep: true })

  watch(secondSidebarFixed, (val) => {
    localStorage.setItem('app:secondSidebarFixed', String(val))
    saveSecondSidebarFixed(val)
  })

  async function saveSecondSidebarFixed(_val: boolean) {
    // TODO: 后端实现后启用
  }

  async function fetchSecondSidebarFixed() {
    // TODO: 后端实现后启用
  }

  return {
    activeFirstMenu,
    activeSecondMenu,
    activeKey,
    expandedKeys,
    addExpandedKey,
    removeExpandedKey,
    toggleExpandedKey,
    clearExpandedKeys,
    collapsed,
    secondSidebarHovered,
    secondSidebarFixed,
    isFirstMenuHovering,
    delayHideSidebar,
    cancelHideSidebar,
    firstMenus,
    systemBottomMenus,
    businessMenus,
    secondMenusMap,
    currentSecondMenus,
    tabs,
    activeTabKey,
    openTab,
    closeTab,
    selectFirstMenu,
    navigateToPath,
    findFirstMenuByTabKey,
    syncMenuState,
    promoteToNav,
    syncCustomNavOrder,
    getMenuLabelByKey,
    fetchMenus,
    favorites,
    addFavorite,
    removeFavorite,
    isFavorited,
    toggleFavorite,
    saveFavoritesOrder,
    customNavMenus,
    saveCustomNavMenus,
    userInfo,
    setUserInfo,
  }
})
