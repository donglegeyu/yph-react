<template>
  <div class="first-sidebar">
    <!-- 品牌区 -->
    <div class="brand-area">
      <!-- Logo行 -->
      <a-popover v-model:open="domainPopoverVisible" trigger="click" placement="right" :arrow="false">
        <div class="logo-row">
          <div class="logo">
            <img class="logo-icon" src="@/assets/logo.svg" alt="logo" />
          </div>
          <div class="dropdown-icon">
            <svg viewBox="0 0 48 48">
              <use href="#down-c" />
            </svg>
          </div>
        </div>
        <template #content>
          <div class="domain-popover-content">
            <div
              v-for="domain in domains"
              :key="domain.id"
              class="domain-popover-item"
              :class="{ active: currentDomainId === domain.id }"
              @click="handleDomainChange(domain)"
            >
              <span class="domain-label">{{ domain.domainName }}</span>
              <svg v-if="currentDomainId === domain.id" class="check-icon" viewBox="0 0 48 48">
                <use href="#check-one" />
              </svg>
            </div>
          </div>
        </template>
      </a-popover>
      <!-- 域名称 -->
      <div class="domain-name">
        <span>{{ currentDomain?.domainName || '星际造梦' }}</span>
      </div>
    </div>

    <!-- 系统菜单-上（首页、收藏） -->
    <div class="system-menu-top">
      <div
        v-for="menu in firstMenus"
        :key="menu.key"
        class="menu-item menu-item--normal"
        :class="{ active: activeKey === menu.key }"
        @click="handleClick(menu)"
        @mouseenter="handleTopMenuHover(menu)"
        @mouseleave="menu.key === 'favorites' && appStore.delayHideSidebar()"
      >
        <svg class="menu-icon" style="color: inherit;">
          <use :href="`#${getIconName(menu.icon)}`" />
        </svg>
        <span class="menu-label menu-label--normal">{{ menu.label }}</span>
      </div>
      <!-- 分割线：只有菜单数量 > 1 时才显示 -->
      <div v-if="firstMenus.length > 1" class="divider"></div>
    </div>

    <!-- 业务菜单 -->
    <div class="business-menus" ref="businessMenusRef">
      <div
        v-for="menu in displayMenus"
        :key="menu.key"
        class="business-menu-item"
        :class="{ active: activeKey === menu.key }"
        @click="handleClick(menu)"
        @mouseenter="handleBusinessMenuHover(menu)"
        @mouseleave="handleBusinessMenuLeave()"
      >
        <svg class="menu-icon" style="color: inherit;">
          <use :href="`#${getIconName(menu.icon)}`" />
        </svg>
        <span class="menu-label menu-label--normal">{{ menu.label }}</span>
      </div>
      <!-- 更多按钮 -->
      <div
        v-if="hasMore"
        class="business-menu-item more-btn"
        :class="{ active: moreDrawerVisible }"
        @click.stop="openMoreDrawer"
      >
        <svg class="menu-icon" style="color: inherit;">
          <use href="#more-two" />
        </svg>
        <span class="menu-label menu-label--normal">更多</span>
      </div>
    </div>

    <!-- 更多菜单面板 -->
    <MoreMenuDrawer
      v-if="moreDrawerVisible"
      :visible="moreDrawerVisible"
      :menus="moreMenus"
      @close="moreDrawerVisible = false"
      @select="handleMoreSelect"
      @open-custom-nav="openCustomNav"
    />

    <!-- 自定义导航面板 -->
    <Teleport to="body">
      <div v-if="customNavVisible" class="custom-nav-overlay" @click.self="customNavVisible = false">
        <CustomNavPanel
          :visible="customNavVisible"
          :menus="businessMenus"
          :total-count="visibleMenuCount"
          :selected-menus="appStore.customNavMenus"
          @close="customNavVisible = false"
          @update="handleCustomNavUpdate"
        />
      </div>
    </Teleport>

    <!-- 系统菜单-下（个人信息） -->
    <div class="system-menu-bottom">
      <!-- 分割线：只有存在系统菜单时才显示 -->
      <div v-if="systemBottomMenus.length > 0" class="nav-divider"></div>
      <div
        v-for="menu in systemBottomMenus"
        :key="menu.key"
        class="system-bottom-item"
        @click="handleClick(menu)"
      >
        <svg class="menu-icon" style="color: inherit;">
          <use :href="`#${getIconName(menu.icon)}`" />
        </svg>
        <span class="menu-label">{{ menu.label }}</span>
      </div>
      <a-popover
        v-model:open="adminPopoverVisible"
        trigger="click"
        placement="rightBottom"
        :arrow="false"
        overlay-class-name="admin-popover"
      >
        <div class="person-info">
          <div class="avatar">{{ userInfo.username?.charAt(0) || 'A' }}</div>
          <div class="name">{{ userInfo.username || 'admin' }}</div>
        </div>
        <template #content>
          <div class="admin-popover-content">
            <div class="popover-item" @click="handleThemeSettings">
              <div class="popover-icon-wrapper">
                <svg class="popover-icon" data-follow-stroke="currentColor" style="color: inherit;" viewBox="0 0 48 48">
                  <use href="#theme" />
                </svg>
              </div>
              <div class="popover-text-wrapper">
                <span class="popover-title">主题设置</span>
                <span class="popover-description">切换主题颜色</span>
              </div>
            </div>
            <div class="popover-divider"></div>
            <div class="popover-item" @click="handleLogout">
              <div class="popover-icon-wrapper">
                <svg class="popover-icon" data-follow-stroke="currentColor" style="color: inherit;" viewBox="0 0 48 48">
                  <use href="#logout" />
                </svg>
              </div>
              <div class="popover-text-wrapper">
                <span class="popover-title">退出登录</span>
              </div>
            </div>
          </div>
        </template>
      </a-popover>

      <!-- 主题设置抽屉 -->
      <Teleport to="body">
        <div v-if="themeDrawerVisible" class="theme-drawer-overlay" @click.self="themeDrawerVisible = false">
          <div class="theme-drawer">
            <div class="theme-drawer-header">
              <span class="theme-drawer-title">主题设置</span>
              <svg class="theme-drawer-close" viewBox="0 0 48 48" @click="themeDrawerVisible = false">
                <use href="#close" />
              </svg>
            </div>
            <div class="theme-drawer-content">
              <div class="theme-option-group">
                <div class="theme-option-label">主题色</div>
                <div class="theme-colors">
                  <div
                    v-for="color in themeColors"
                    :key="color.value"
                    class="theme-color-item"
                    :class="{ active: selectedThemeColor === color.value }"
                    :style="{ backgroundColor: color.value }"
                    @click="handleThemeColorChange(color.value)"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'
import { useDomains } from '@/composables'
import MoreMenuDrawer from './MoreMenuDrawer.vue'
import CustomNavPanel from './CustomNavPanel.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const { businessMenus, customNavMenus, userInfo, firstMenus, systemBottomMenus } = storeToRefs(appStore)

const { fetchAllDomains } = useDomains()
const domains = ref<any[]>([])
const currentDomainId = ref<number | null>(null)
const domainPopoverVisible = ref(false)
const currentDomain = computed(() => domains.value.find(d => d.id === currentDomainId.value))

// activeKey - 点击时更新，路由变化时也更新
const activeKey = ref('')
// 悬浮模式标记
const isHovering = ref(false)

// admin气泡弹窗
const adminPopoverVisible = ref(false)

// 主题设置
const themeDrawerVisible = ref(false)
const themeColors = [
  { label: '橙色', value: '#F95914' },
  { label: '蓝色', value: '#1890ff' },
  { label: '绿色', value: '#52c41a' },
  { label: '紫色', value: '#722ed1' },
  { label: '红色', value: '#f5222d' },
  { label: '金黄色', value: '#faad14' },
]
const savedThemeColor = localStorage.getItem('theme:color') || '#F95914'
const selectedThemeColor = ref(savedThemeColor)

function handleThemeSettings() {
  adminPopoverVisible.value = false
  // 打开主题设置标签页
  appStore.openTab('theme-settings', '主题设置', '/component-preview')
  // 立即清空状态，防止路由变化时的 watcher 重新设置
  appStore.activeFirstMenu = ''
  appStore.activeKey = ''
  appStore.expandedKeys = []
  appStore.secondSidebarHovered = false
  // 清空本地 activeKey（一级菜单选中状态）
  activeKey.value = ''
  // 跳转路由
  router.push('/component-preview')
}

function handleThemeColorChange(color: string) {
  selectedThemeColor.value = color
  localStorage.setItem('theme:color', color)
  const event = new CustomEvent('theme-color-change', { detail: { color } })
  window.dispatchEvent(event)
}

function handleLogout() {
  adminPopoverVisible.value = false
  localStorage.removeItem('token')
  localStorage.removeItem('app:userInfo')
  router.push('/login')
}

function handleDomainChange(domain: any) {
  currentDomainId.value = domain.id
  localStorage.setItem('currentDomainId', String(domain.id))
  domainPopoverVisible.value = false
  // 强制刷新菜单
  appStore.fetchMenus(true)
}

watch(() => route.path, (path) => {
  if (path === '/home') {
    activeKey.value = 'home'
  } else if (path === '/favorites') {
    activeKey.value = 'favorites'
  } else {
    // 等待 secondMenusMap 加载完成后，由 SecondSidebar 的 watch 来设置 activeKey
    // 但需要确保 FirstSidebar 也能正确显示选中状态
    // 检测 activeFirstMenu 是否有效
    const validFirstMenuKeys = Object.keys(appStore.secondMenusMap)
    if (appStore.activeFirstMenu && validFirstMenuKeys.includes(appStore.activeFirstMenu)) {
      activeKey.value = appStore.activeFirstMenu
    }
  }
}, { immediate: true })

// 监听 activeFirstMenu 变化（由 navigateToPath 更新时同步 activeKey）
watch(() => appStore.activeFirstMenu, (newFirstMenu) => {
  // 悬浮模式下不自动改变 activeKey，保持选中状态
  if (!isHovering.value) {
    if (newFirstMenu === 'home' || newFirstMenu === 'favorites' || !newFirstMenu) {
      // 非菜单路径，清空选中状态
      activeKey.value = ''
    } else {
      // 正常业务菜单
      activeKey.value = newFirstMenu
    }
  }
})

// 图标名称映射（将后端返回的图标映射到本地存在的图标）
const iconMap: Record<string, string> = {
  'commodity': 'tag',
  'shopping': 'shopping-cart-add',
  'goods': 'tag',
  'buy': 'shopping-cart-add',
}

// 默认菜单图标
const DEFAULT_ICON = 'id-card-v-klbe0a04'

// 获取有效的图标名称
function getIconName(icon: string | undefined): string {
  return icon ? iconMap[icon] || icon : DEFAULT_ICON
}

// 页面加载时获取菜单数据
onMounted(async () => {
  // 加载有权限的域列表
  domains.value = await fetchAllDomains()
  
  // 加载当前选中的域
  const savedDomainId = localStorage.getItem('currentDomainId')
  if (savedDomainId) {
    currentDomainId.value = Number(savedDomainId)
  } else if (domains.value.length > 0) {
    currentDomainId.value = domains.value[0].id
    localStorage.setItem('currentDomainId', String(domains.value[0].id))
  }
  
  appStore.fetchMenus()
  // 初始化：首页不显示二级菜单面板
  appStore.secondSidebarHovered = false
  // 点击外部区域关闭更多面板
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 点击外部关闭面板
function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (moreDrawerVisible.value && !target.closest('.more-panel') && !target.closest('.menu-item')) {
    moreDrawerVisible.value = false
  }
}

// 业务菜单容器引用
const businessMenusRef = ref<HTMLElement | null>(null)
// 菜单项高度
const MENU_ITEM_HEIGHT = 40
// 根据容器高度计算可显示的菜单数量（最多6个，因为第7个位置给更多按钮）
const visibleMenuCount = computed(() => {
  if (!businessMenusRef.value) return 6
  const containerHeight = businessMenusRef.value.clientHeight
  const calculated = Math.floor(containerHeight / MENU_ITEM_HEIGHT)
  return Math.min(calculated, 6)
})

// 业务菜单显示规则：根据容器高度动态显示
const hasMore = computed(() => businessMenus.value.length > 6)
const displayMenus = computed(() => {
  const maxVisible = visibleMenuCount.value
  
  if (Array.isArray(customNavMenus.value) && customNavMenus.value.length > 0) {
    const customCount = customNavMenus.value.length
    if (customCount >= maxVisible) {
      return customNavMenus.value.slice(0, maxVisible).map((m: any) => ({
        ...m,
        icon: m.icon || DEFAULT_ICON,
      }))
    }
    const existingKeys = new Set(customNavMenus.value.map((m: any) => m.key))
    const additionalMenus = businessMenus.value
      .filter((m: any) => !existingKeys.has(m.key))
      .slice(0, maxVisible - customCount)
    return [
      ...customNavMenus.value.map((m: any) => ({
        ...m,
        icon: m.icon || DEFAULT_ICON,
      })),
      ...additionalMenus.map((m: any) => ({
        ...m,
        icon: m.icon || DEFAULT_ICON,
      })),
    ]
  }
  return businessMenus.value.slice(0, maxVisible).map((m: any) => ({
    ...m,
    icon: m.icon || DEFAULT_ICON,
  }))
})

// 同步 displayMenus 的顺序到 customNavMenus（仅在顺序不一致时更新，避免循环）
watch(displayMenus, (newDisplayMenus) => {
  if (!newDisplayMenus || newDisplayMenus.length === 0 || !Array.isArray(customNavMenus.value) || customNavMenus.value.length === 0) return
  const displayKeys = newDisplayMenus.map((m: any) => m.key)
  const currentKeys = customNavMenus.value.map((m: any) => m.key)
  // 检查顺序是否一致（只看 customNavMenus 中在 displayMenus 里的那些）
  const orderedKeys = currentKeys.filter((k: string) => displayKeys.includes(k))
  const expectedOrder = orderedKeys.sort((a: string, b: string) => displayKeys.indexOf(a) - displayKeys.indexOf(b))
  const isSameOrder = orderedKeys.every((k: string, i: number) => k === expectedOrder[i])
  if (!isSameOrder) {
    appStore.syncCustomNavOrder(newDisplayMenus)
  }
})

// 更多菜单：显示所有业务菜单，顺序与自定义导航栏一致
const moreMenus = computed(() => {
  if (Array.isArray(customNavMenus.value) && customNavMenus.value.length > 0) {
    const customKeys = new Map(customNavMenus.value.map((m: any, i: number) => [m.key, i]))
    return [...businessMenus.value].sort((a, b) => {
      const aIndex = customKeys.get(a.key) ?? Infinity
      const bIndex = customKeys.get(b.key) ?? Infinity
      return aIndex - bIndex
    })
  }
  return businessMenus.value
})

// 更多抽屉
const moreDrawerVisible = ref(false)
function openMoreDrawer() {
  moreDrawerVisible.value = true
}
function handleMoreSelect(menu: any) {
  activeKey.value = menu.key
  appStore.selectFirstMenu(menu.key)
  // 提升到导航栏显示
  appStore.promoteToNav(menu.key)
  moreDrawerVisible.value = false
}

// 自定义导航面板
const customNavVisible = ref(false)
function openCustomNav() {
  if (!customNavMenus.value || customNavMenus.value.length === 0) {
    appStore.customNavMenus = [...displayMenus.value]
  }
  customNavVisible.value = true
}
function handleCustomNavUpdate(selected: any[]) {
  appStore.customNavMenus = selected
}

function handleTopMenuHover(menu: any) {
  if (menu.key === 'favorites' && !appStore.secondSidebarFixed) {
    appStore.selectFirstMenu(menu.key)
    appStore.cancelHideSidebar()
  } else if (menu.key === 'home') {
    appStore.secondSidebarHovered = false
  }
}

function handleBusinessMenuHover(menu: any) {
  // 标记为悬浮状态，防止自动改变 activeKey
  isHovering.value = true
  // 标记鼠标正在悬停在一级菜单
  appStore.isFirstMenuHovering = true
  
  // 悬浮模式：显示对应二级面板
  if (!appStore.secondSidebarFixed) {
    // 切换 activeFirstMenu 显示对应的二级面板
    appStore.activeFirstMenu = menu.key
    appStore.secondSidebarHovered = true
    appStore.cancelHideSidebar()
  }
}

function handleBusinessMenuLeave() {
  // 离开时重置悬浮状态
  isHovering.value = false
  appStore.isFirstMenuHovering = false
  appStore.delayHideSidebar()
}

function handleClick(menu: any) {
  if (menu.key === 'home') {
    activeKey.value = 'home'
    appStore.selectFirstMenu('home')
    // 切换到首页，清空二级菜单选中态
    appStore.activeKey = ''
    appStore.expandedKeys = []
    // 隐藏二级菜单面板
    appStore.secondSidebarHovered = false
    router.push('/home')
  } else if (menu.key === 'favorites') {
    activeKey.value = 'favorites'
    appStore.selectFirstMenu('favorites')
    router.push('/favorites')
  } else if (menu.path) {
    activeKey.value = menu.key
    appStore.selectFirstMenu(menu.key)
    // 切换一级菜单时清空二级菜单选中态，保留展开状态
    appStore.activeKey = ''
    // 点击业务菜单时显示二级面板
    if (!appStore.secondSidebarFixed) {
      appStore.secondSidebarHovered = true
    }
    router.push(menu.path)
  } else {
    activeKey.value = menu.key
    appStore.selectFirstMenu(menu.key)
    // 切换一级菜单时清空二级菜单选中态，保留展开状态
    appStore.activeKey = ''
    // 如果菜单没有子菜单，不显示二级面板
    const seconds = appStore.secondMenusMap[menu.key] || []
    const hasAnyMenu = seconds.length > 0
    const firstWithChildren = seconds.find((m: any) => m.children?.length)
    if (hasAnyMenu) {
      // 如果有三级菜单，展开第一个
      if (firstWithChildren && !appStore.expandedKeys.includes(firstWithChildren.key)) {
        appStore.expandedKeys = [...appStore.expandedKeys, firstWithChildren.key]
      }
      // 点击业务菜单时显示二级面板
      if (!appStore.secondSidebarFixed) {
        appStore.secondSidebarHovered = true
      }
    }
    // 没有子菜单时不处理 expandedKeys，保留用户展开的状态
  }
}
</script>

<style scoped lang="scss">
.first-sidebar {
  width: 7.88rem;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0 1rem 0;
  z-index: 2;
  background: #1F1F1F;
}

.brand-area {
  width: 7.88rem;
  height: 3.75rem;
  display: flex;
  flex-direction: column;
  padding: 0 0.75rem;
  gap: 0.3125rem;
  z-index: 1;
}

.logo-row {
  width: 6.38rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo {
  width: 3.63rem;
  height: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.logo-icon {
  width: 100%;
  height: 1.5rem;
  object-fit: contain;
}

.dropdown-icon {
  width: 0.75rem;
  height: 0.75rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.dropdown-icon svg {
  width: 100%;
  height: 100%;
  color: rgba(255, 255, 255, 0.65);
}

.domain-name {
  width: 6.38rem;
  height: 1.94rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.domain-name span {
  width: 6.38rem;
  height: 1.94rem;
  font-size: 1.38rem;
  font-weight: 600;
  line-height: normal;
  color: #FFFFFF;
}

.system-menu-top {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  padding: 0 0.5rem;
  gap: 0.25rem;
  margin-top: 1.5rem;
}

.divider {
  width: 5.88rem;
  height: 0.06rem;
  align-self: center;
  background: rgba(255, 255, 255, 0.2);
  margin-top: 4px;
  margin-bottom: 4px;
}

.business-menus {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 0 0.5rem;
  gap: 0.25rem;
}

.system-menu-bottom {
  width: 126px;
  height: auto;
  display: flex;
  flex-direction: column;
  padding: 0 12px;
  gap: 12px;
  align-self: stretch;
  z-index: 4;
}

.nav-divider {
  width: 102px;
  height: 1px;
  align-self: stretch;
  z-index: 0;
  opacity: 0.2;
  background: var(--ant-color-text-light-solid);
}

.person-info {
  width: 102px;
  height: 20px;
  display: flex;
  align-items: center;
  padding: 0;
  gap: 8px;
  align-self: stretch;
  z-index: 5;
}

.system-bottom-item {
  width: 102px;
  height: 20px;
  display: flex;
  align-items: center;
  padding: 0;
  gap: 8px;
  align-self: stretch;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.65);
  transition: all 0.2s;
  z-index: 5;
}

.system-bottom-item .menu-icon {
  width: 16px;
  height: 16px;
  stroke: currentColor !important;
  stroke-width: 4;
  fill: none !important;
  flex-shrink: 0;
  color: inherit;
}

.system-bottom-item .menu-label {
  font-family: PingFang SC;
  font-size: 12px;
  font-weight: normal;
  line-height: 20px;
  color: rgba(255, 255, 255, 0.65);
  white-space: nowrap;
}

.person-info .avatar {
  width: 16px;
  height: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0;
  gap: 8px;
  z-index: 0;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 10px;
}

.person-info .name {
  font-family: PingFang SC;
  font-size: 12px;
  font-weight: normal;
  line-height: 20px;
  color: rgba(255, 255, 255, 0.65);
}

.person-info .role {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 0 8px;
  gap: 8px;
  align-self: stretch;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.65);
  transition: all 0.2s;
  position: relative;
  overflow: hidden;

  &:hover:not(.active) {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }

  &.active {
    color: #FFFFFF;
    background: #F95914;

    .menu-label {
      color: #FFFFFF;
    }
  }
}

.business-menu-item {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  gap: 8px;
  align-self: stretch;
  border-radius: 4px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.65);
  transition: all 0.2s;
  margin-bottom: 0;

  &:hover:not(.active) {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }

  &.active {
    color: #FFFFFF;
    background: #F95914;

    .menu-label {
      color: #FFFFFF;
    }
  }
}

.more-btn {
  &.active {
    color: rgba(255, 255, 255, 0.65);
    background: transparent;

    .menu-label {
      color: rgba(255, 255, 255, 0.65);
    }
  }
}

.menu-icon {
  width: 16px;
  height: 16px;
  stroke: currentColor !important;
  stroke-width: 4;
  fill: none;
  flex-shrink: 0;
}

.menu-label {
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 400;
  text-align: left;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.65);
  transition: color 0.25s ease, font-weight 0.2s ease;
}

.menu-label--normal {
  font-size: 14px;
  line-height: 22px;
}

.menu-item--normal {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  gap: 8px;
  align-self: stretch;
  border-radius: 4px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.65);
  transition: all 0.2s;
  margin-bottom: 0;

  &:hover:not(.active) {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }

  &.active {
    color: #FFFFFF;
    background: #F95914;

    .menu-label {
      color: #FFFFFF;
    }
  }
}

.menu-item--compact {
  width: 102px;
  height: 20px;
  display: flex;
  align-items: center;
  padding: 0;
  gap: 8px;
  align-self: stretch;
  margin-bottom: 2px;
}

.menu-item--compact .menu-icon {
  width: 16px;
  height: 16px;
  stroke: currentColor !important;
  stroke-width: 4;
  fill: none;
  flex-shrink: 0;
}

.menu-item--compact .menu-label {
  font-family: PingFang SC;
  font-size: 12px;
  font-weight: normal;
  line-height: 20px;
  color: rgba(255, 255, 255, 0.65);
  white-space: nowrap;
}

.custom-nav-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-bg-mask);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.admin-popover-content {
  width: 160px;
  height: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.popover-item {
  width: 100%;
  height: 38px;
  display: flex;
  padding: 4px 12px;
  gap: 6px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
  color: var(--color-text);
  box-sizing: border-box;

  &:hover {
    background-color: var(--color-bg-light);
  }
}

.popover-icon-wrapper {
  width: 20px;
  height: 30px;
  display: flex;
  padding: 0;
  gap: 0;
  align-items: center;
  flex-shrink: 0;
  color: var(--color-text);
  box-sizing: border-box;
  overflow: hidden;
}

.popover-text-wrapper {
  width: auto;
  height: 30px;
  display: flex;
  flex-direction: column;
  padding: 0;
  gap: 2px;
  flex: 1;
  box-sizing: border-box;
  justify-content: center;
}

.popover-title {
  font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  color: var(--color-text);
}

.popover-description {
  font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: normal;
  line-height: 14px;
  color: var(--color-text-tertiary);
}

.popover-icon {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
  flex-shrink: 0;
  align-self: flex-start;
}

.popover-divider {
  height: 1px;
  background: var(--color-border-secondary);
  margin: 8px 0;
}

:global(.admin-popover) {
  border-radius: 8px !important;
  background: var(--color-bg-elevated) !important;
  box-shadow: 0 4px 16px var(--color-bg-mask) !important;
}

.domain-popover-content {
  width: 180px;
  max-height: 300px;
  overflow-y: auto;
}

.domain-popover-item {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
  color: var(--color-text);
  box-sizing: border-box;

  &:hover {
    background-color: var(--color-bg-light);
  }

  &.active {
    background-color: var(--primary-color-light-1);

    .domain-label {
      color: var(--primary-color);
      font-weight: 500;
    }
  }
}

.domain-label {
  font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 20px;
  color: var(--color-text);
}

.check-icon {
  width: 16px;
  height: 16px;
  color: var(--primary-color);
}

.theme-drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-bg-mask);
  display: flex;
  justify-content: flex-end;
  z-index: 2000;
}

.theme-drawer {
  width: 320px;
  height: 100%;
  background: var(--color-bg-container);
  box-shadow: -2px 0 8px var(--color-bg-mask);
  display: flex;
  flex-direction: column;
}

.theme-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.theme-drawer-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text);
}

.theme-drawer-close {
  width: 20px;
  height: 20px;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: color 0.2s;

  &:hover {
    color: var(--color-text);
  }
}

.theme-drawer-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.theme-option-group {
  margin-bottom: 24px;
}

.theme-option-label {
  font-size: 14px;
  color: var(--color-text);
  margin-bottom: 12px;
}

.theme-colors {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.theme-color-item {
  width: 48px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;

  &:hover {
    transform: scale(1.1);
  }

  &.active {
    border-color: var(--color-text);
    box-shadow: 0 2px 8px var(--color-text-disabled);
  }
}
</style>
