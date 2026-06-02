<template>
  <!-- 二级菜单面板 -->
  <!-- DEBUG: activeFirstMenu = {{ activeFirstMenu }}, favorites.length = {{ favorites?.length }} -->
  <div
    v-if="showSecondSidebar"
    class="second-sidebar"
    :class="{ 'is-fixed': secondSidebarFixed }"
  >
    <div
    class="menu-list"
    @mouseenter="appStore.cancelHideSidebar()"
    @mouseleave="appStore.delayHideSidebar()"
  >
      <!-- 收藏面板使用拖拽排序 -->
      <draggable
        v-if="activeFirstMenu === 'favorites'"
        v-model="favoritesList"
        item-key="menuKey"
        handle=".drag-handle"
        :animation="200"
        ghost-class="ghost"
        @end="onDragEnd"
      >
        <template #item="{ element }">
          <div
            class="menu-item single"
            :class="{ active: activeKey === element.key }"
            @click="handleClick(element)"
          >
            <svg class="drag-handle" viewBox="0 0 48 48">
              <use href="#drag" />
            </svg>
            <span class="menu-label">{{ element.label }}</span>
            <svg
              class="favorite-icon favorited"
              :class="{ 'active': activeKey === element.key }"
              viewBox="0 0 24 24"
              @click.stop="appStore.removeFavorite(element.key || element.menuKey)"
            >
              <use href="#star-fill" />
            </svg>
          </div>
        </template>
      </draggable>
      <!-- 其他菜单保持原有结构 -->
      <template v-else v-for="menu in secondMenus" :key="menu.key">
        <!-- 有子菜单的二级菜单 -->
        <div v-if="menu.children?.length" class="menu-group">
          <div
            class="menu-item parent"
            :class="{ expanded: expandedKeys.includes(menu.key) }"
            @click="toggleExpand(menu.key)"
          >
            <svg class="menu-icon">
              <use :href="`#${getIcon(menu.icon)}`" />
            </svg>
            <span class="menu-label">{{ menu.label }}</span>
            <svg class="expand-icon" :class="{ rotated: expandedKeys.includes(menu.key) }" viewBox="0 0 48 48">
              <use href="#down" />
            </svg>
          </div>
          <div v-show="expandedKeys.includes(menu.key)" class="sub-menu">
            <div
              v-for="sub in menu.children"
              :key="sub.key"
              class="menu-item child"
              :class="{ active: activeKey === sub.key }"
              @click="handleClick(sub)"
            >
              <span class="menu-label">{{ sub.label }}</span>
              <svg
                class="favorite-icon"
                :class="{ favorited: appStore.isFavorited(sub.key) }"
                viewBox="0 0 24 24"
                @click.stop="toggleFavorite(sub)"
              >
                <use :href="appStore.isFavorited(sub.key) ? '#star-fill' : '#star'" />
              </svg>
            </div>
          </div>
        </div>
        <!-- 没有子菜单的二级菜单 -->
        <div
          v-else
          class="menu-item single"
          :class="{ active: activeKey === menu.key }"
          @click="handleClick(menu)"
        >
          <svg class="menu-icon">
            <use :href="`#${getIcon(menu.icon)}`" />
          </svg>
          <span class="menu-label">{{ menu.label }}</span>
          <svg
            class="favorite-icon"
            :class="{ favorited: appStore.isFavorited(menu.key) }"
            viewBox="0 0 24 24"
            @click.stop="toggleFavorite(menu)"
          >
            <use :href="appStore.isFavorited(menu.key) ? '#star-fill' : '#star'" />
          </svg>
        </div>
      </template>
      <!-- 收藏为空时显示暂无收藏 -->
      <div v-if="activeFirstMenu === 'favorites' && favoritesList.length === 0" class="empty-tip">
        <img src="@/assets/null.svg" class="empty-img" alt="暂无收藏" />
        <span>暂无收藏</span>
      </div>
      <!-- 二级菜单为空时显示暂无菜单 -->
      <div v-else-if="activeFirstMenu !== 'favorites' && secondMenus.length === 0" class="empty-tip">
        <img src="@/assets/null.svg" class="empty-img" alt="暂无菜单" />
        <span>暂无菜单</span>
      </div>
    </div>
    <!-- 固定收起按钮 -->
    <div class="collapse-container">
      <div class="collapse-divider"></div>
      <div
        class="collapse-btn"
        @click="toggleCollapse"
        @mouseenter="appStore.cancelHideSidebar()"
        @mouseleave="appStore.delayHideSidebar()"
      >
        <svg class="collapse-icon" viewBox="0 0 48 48">
          <use :href="secondSidebarFixed ? '#pin' : '#pushpin'" />
        </svg>
        <span>{{ secondSidebarFixed ? '悬浮菜单' : '固定菜单' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'
import draggable from 'vuedraggable'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const { activeFirstMenu, currentSecondMenus, secondSidebarHovered, secondSidebarFixed, favorites, activeKey, expandedKeys, isFirstMenuHovering } = storeToRefs(appStore)

// localStorage keys
const STORAGE_KEYS = {
  ACTIVE_KEY: 'sidebar:activeKey',
  EXPANDED_KEYS: 'sidebar:expandedKeys',
}

// 保存展开状态到后端（暂时禁用，等待后端实现）
async function saveExpandedKeys(_keys: string[]) {
  // TODO: 后端实现后启用
  // try {
  //   await fetch('/api/user-preferences', {
  //     method: 'PUT',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ key: 'secondSidebarExpandedKeys', value: JSON.stringify(keys) }),
  //   })
  // } catch (e) {
  //   console.error('saveExpandedKeys failed:', e)
  // }
}

// 初始化时从后端获取（暂时禁用）
// fetchExpandedKeys()

// 持久化 activeKey 到 localStorage
watch(activeKey, (val) => {
  if (val) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_KEY, val)
  }
})

// 持久化 expandedKeys（本地 + 后端）
watch(expandedKeys, (val) => {
  localStorage.setItem(STORAGE_KEYS.EXPANDED_KEYS, JSON.stringify(val))
  saveExpandedKeys(val)
}, { deep: true })

// 初始化时从 localStorage 恢复（仅作为 fallback，优先使用 appStore 的值）
onMounted(() => {
  const savedActiveKey = localStorage.getItem(STORAGE_KEYS.ACTIVE_KEY)
  const savedExpandedKeys = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPANDED_KEYS) || '[]')
  if (savedActiveKey && !activeKey.value) {
    activeKey.value = savedActiveKey
  }
  if (savedExpandedKeys.length > 0 && expandedKeys.value.length === 0) {
    expandedKeys.value = savedExpandedKeys
  }
})

// 监听 secondMenusMap 加载完成后恢复状态
watch(() => appStore.secondMenusMap, (newMap) => {
  if (Object.keys(newMap).length > 0) {
    // 首页不需要处理
    if (route.path === '/home' || route.path === '/') {
      return
    }

    const checkMenuPath = (path: string) => {
      return Object.values(newMap).some(menus =>
        menus.some(menu => menu.path === path ||
          menu.children?.some(child => child.path === path))
      )
    }

    // 检测当前路由是否在菜单配置中
    let isMenuPath = checkMenuPath(route.path)
    let menuPath = route.path

    // 如果当前路径不在菜单中，检查父路径（详情页场景）
    if (!isMenuPath) {
      const lastSlashIndex = route.path.lastIndexOf('/')
      if (lastSlashIndex > 0) {
        const parentPath = route.path.substring(0, lastSlashIndex)
        if (checkMenuPath(parentPath)) {
          isMenuPath = true
          menuPath = parentPath
        }
      }
    }

    // 非菜单路径（如主题设置页面），清空状态
    if (!isMenuPath) {
      appStore.activeFirstMenu = ''
      appStore.activeKey = ''
      appStore.expandedKeys = []
      activeKey.value = ''
      appStore.clearExpandedKeys()
      return
    }

    // 正常菜单路径，恢复一级菜单选中状态
    const result = appStore.navigateToPath(menuPath)
    if (result) {
      // 恢复 activeKey
      const menu = result.thirdMenu || result.secondMenu
      if (menu) {
        activeKey.value = menu.key
      }
      // 恢复 expandedKeys（不收起其他已展开的）
      if (result.secondMenu) {
        appStore.addExpandedKey(result.secondMenu.key)
      }
      // 强制触发 activeFirstMenu 变化，确保 FirstSidebar 也能更新
      const currentFirstMenu = appStore.activeFirstMenu
      if (currentFirstMenu === result.firstKey) {
        appStore.activeFirstMenu = ''
        nextTick(() => {
          appStore.activeFirstMenu = result.firstKey
        })
      }
    }
  }
}, { immediate: true })

// 监听 activeFirstMenu 变化
// 只有在鼠标悬停在一级菜单时才显示二级面板，Tab 切换时不显示
watch(() => appStore.activeFirstMenu, (newFirstMenu, oldFirstMenu) => {
  if (newFirstMenu !== oldFirstMenu && newFirstMenu) {
    if (!secondSidebarFixed.value && isFirstMenuHovering.value) {
      appStore.secondSidebarHovered = true
      // 悬停时自动展开第一个有子菜单的二级菜单
      if (expandedKeys.value.length === 0 && currentSecondMenus.value.length > 0) {
        const firstWithChildren = currentSecondMenus.value.find((m: any) => m.children?.length)
        if (firstWithChildren) {
          appStore.addExpandedKey(firstWithChildren.key)
        }
      }
    }
  }
})

// 监听 currentSecondMenus 变化，恢复二级菜单展开状态和 activeKey
watch(currentSecondMenus, (menus) => {
  if (menus.length === 0) return

  // 悬停时自动展开第一个有子菜单的二级菜单
  if (isFirstMenuHovering.value && expandedKeys.value.length === 0) {
    const firstWithChildren = menus.find((m: any) => m.children?.length)
    if (firstWithChildren) {
      appStore.addExpandedKey(firstWithChildren.key)
      return
    }
  }

  const currentPath = route.path
  if (currentPath === '/home' || currentPath === '/') return

  // 通过 route.path 直接查找菜单
  let targetMenu: any = null
  let parentMenu: any = null

  for (const menu of menus) {
    if (menu.path === currentPath) {
      targetMenu = menu
      break
    }
    if (menu.children?.length) {
      for (const sub of menu.children) {
        if (sub.path === currentPath) {
          targetMenu = sub
          parentMenu = menu
          break
        }
      }
    }
    if (targetMenu) break
  }

  if (targetMenu) {
    // 设置 activeKey 为目标菜单
    activeKey.value = targetMenu.key
    // 展开对应的二级菜单（不收起其他）
    const keyToExpand = parentMenu ? parentMenu.key : (targetMenu?.children?.length ? targetMenu.key : null)
    if (keyToExpand) {
      appStore.addExpandedKey(keyToExpand)
    }
  }
}, { immediate: true })

// 二级菜单默认图标映射
const defaultIcons: Record<string, string> = {
  'menu': 'list',
  'setting': 'setting',
  'domain': 'earth',
  'user': 'people',
  'role': 'people',
  'permission': 'key',
  'log': 'doc-detail',
  'config': 'setting-one',
  'default': 'id-card-v-klbe0a04',
}

// 图标名称映射（将后端返回的图标映射到本地/CDN存在的图标）
const iconMap: Record<string, string> = {
  'shopping': 'shopping-cart-del',
  'buy': 'shopping-cart-del',
  'goods': 'tag',
  'file': 'file-cabinet',
  'search': 'doc-search',
  'user': 'people-top-card',
  'safe': 'message-security',
  'tool': 'setting',
  'app': 'all-application',
}

// 获取菜单图标
function getIcon(icon?: string): string {
  if (icon) return iconMap[icon] || icon
  return defaultIcons['default']
}

// 收藏列表（用于拖拽排序）- 使用映射后的数据保持一致性
const favoritesList = computed({
  get: () => secondMenus.value,  // 使用secondMenus的映射结果
  set: (val) => {
    // 拖拽排序时直接更新favorites
    favorites.value = val
  }
})

// 拖拽结束后保存排序
async function onDragEnd() {
  await appStore.saveFavoritesOrder(favoritesList.value)
}

// 控制二级菜单面板显示
const showSecondSidebar = computed(() => {
  // 首页或无效菜单不显示面板
  if (!activeFirstMenu.value || activeFirstMenu.value === 'home') {
    return false
  }
  // 悬浮状态或固定状态都显示
  return secondSidebarHovered.value || secondSidebarFixed.value
})

const secondMenus = computed(() => {
  // 收藏面板显示用户收藏的项
  console.log('[secondMenus computed] activeFirstMenu:', activeFirstMenu.value, 'favorites:', favorites.value)
  if (activeFirstMenu.value === 'favorites') {
    const mapped = (favorites.value || []).map((item: any) => ({
      key: item.menuKey || item.key || item.id,
      label: item.menuLabel || item.label || item.name || item.title || '未命名',
      path: item.menuPath || item.path || `/menu/${item.menuKey || item.key}`,
    }))
    console.log('[secondMenus computed] favorites mapped:', mapped)
    return mapped
  }
  // 隐藏只在菜单管理页面显示的内部链接菜单（不在二级面板展示）
  const hideKeys = ['system-settings', 'component-preview']
  return (currentSecondMenus.value || [])
    .filter((menu: any) => !hideKeys.includes(menu.key) && !hideKeys.includes(menu.menuKey))
    .map((menu: any) => ({
      ...menu,
      icon: getIcon(menu.icon),
    }))
})

function toggleExpand(key: string) {
  appStore.toggleExpandedKey(key)
}

// @ts-expect-error - 暂时未使用
function isParentActive(menu: any): boolean {
  return menu.children?.some((child: any) => child.key === activeKey.value) || false
}

function toggleCollapse() {
  appStore.secondSidebarFixed = !appStore.secondSidebarFixed
}

function handleClick(menu: any) {
  if (menu.path) {
    // 先尝试用 navigateToPath 设置一级菜单
    appStore.navigateToPath(menu.path)
    // 打开页签
    appStore.openTab(menu.key, menu.label, menu.path)
    // 设置 activeKey
    activeKey.value = menu.key
    // 设置 expandedKeys：如果有子菜单展开自身，否则查找父级（不收起其他）
    if (menu.children?.length) {
      appStore.addExpandedKey(menu.key)
    } else {
      const parent = currentSecondMenus.value.find((m: any) =>
        m.children?.some((c: any) => c.key === menu.key)
      )
      if (parent) {
        appStore.addExpandedKey(parent.key)
      }
    }
    router.push(menu.path)
  }
  // 悬浮状态下点击后隐藏面板
  if (!secondSidebarFixed.value) {
    appStore.secondSidebarHovered = false
  }
}

// 切换收藏状态
async function toggleFavorite(menu: any) {
  await appStore.toggleFavorite(menu)
}

// 移除收藏（收藏面板专用）
// @ts-expect-error - 暂时未使用
async function removeFavorite(menu: any) {
  await appStore.removeFavorite(menu)
}

// 监听路由变化，只负责导航（打开 Tab）
// activeKey 和 expandedKeys 由 currentSecondMenus watcher 统一处理
watch(() => route.path, (path) => {
  if (path === '/home' || path === '/') return

  let menuPath = path
  let result = appStore.navigateToPath(path)

  if (!result) {
    const lastSlashIndex = path.lastIndexOf('/')
    if (lastSlashIndex > 0) {
      const parentPath = path.substring(0, lastSlashIndex)
      result = appStore.navigateToPath(parentPath)
      if (result) {
        menuPath = parentPath
      }
    }
  }

  if (result) {
    const menu = result.thirdMenu || result.secondMenu
    if (menu) {
      appStore.openTab(
        menu.key,
        menu.label,
        menu.path
      )
    }
  } else {
    activeKey.value = ''
    appStore.clearExpandedKeys()
  }
}, { immediate: true })

// 一级菜单切换时的选中状态重置已移至 FirstSidebar 的点击事件中处理
</script>

<style scoped lang="scss">
.second-sidebar {
  position: fixed;
  left: 7.88rem;
  top: 0;
  width: 220px;
  min-width: 220px;
  height: 100vh;
  background: #fff;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  padding: 20px 8px 0;
  z-index: 100;
  box-shadow: 3px 0 5px rgba(0, 0, 0, 0.06);

  &.is-fixed {
    position: relative;
    left: 0;
    z-index: 1;
    box-shadow: none;
    border-right: none;
  }
}

.menu-list {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  display: flex;
  flex-direction: column;

  &::-webkit-scrollbar {
    display: none;
  }
}

.collapse-container {
  flex-shrink: 0;
  padding: 5px 0;
}

.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
  gap: 8px;
}

.empty-img {
  width: 60px;
  height: 60px;
}

.collapse-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 0 0 5px 0;
}

.menu-group {
  margin-bottom: 4px;
}

.menu-item {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  cursor: pointer;
  color: #333333;
  transition: all 0.2s ease;
  position: relative;
  gap: 4px;
  border-radius: 4px;

  &:hover {
    background: #f5f5f5;
  }

  &.active {
    color: var(--ant-color-primary, #F95914);
    background: #FFF7F0;
    font-weight: 500;

    .menu-label {
      color: var(--ant-color-primary, #F95914);
    }

    .favorite-icon {
      opacity: 1;
    }
  }

  &.parent {
    font-weight: 500;
    font-size: 14px;

    &:hover {
      background: #f5f5f5;
    }
  }

  &.child {
    padding-left: 36px;
    font-size: 13px;
    height: 40px;
  }

  &.single {
    font-size: 14px;
  }
}

.menu-icon {
  width: 16px;
  height: 16px;
  stroke: currentColor !important;
  stroke-width: 4;
  fill: none;
  flex-shrink: 0;
  color: inherit;

  .active & {
    color: inherit;
  }
}

.menu-label {
  flex: 1;
  font-family: PingFang SC;
  font-size: 14px;
  font-weight: normal;
  line-height: 22px;
  letter-spacing: normal;
  color: rgba(0, 0, 0, 0.88);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}

.expand-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
  color: #999999;

  &.rotated {
    transform: rotate(180deg);
  }
}

.favorite-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: rgba(0, 0, 0, 0.45);
  opacity: 0;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }

  .child:hover &,
  &.favorited {
    opacity: 1;
  }

  &.favorited {
    stroke: none !important;
  }
}

// 菜单选中时：收藏图标显示主色
.child.active .favorite-icon {
  color: #F95914 !important;
}

// 收藏面板选中时：收藏图标显示主色
.menu-item.single.active .favorite-icon.active {
  color: #F95914 !important;
}

.drag-handle {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  cursor: grab;
  color: #999999;
  opacity: 0.5;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }

  &:active {
    cursor: grabbing;
  }
}

.ghost {
  opacity: 0.4;
  background: #f5f5f5;
}

.sub-menu {
  margin-top: 2px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.collapse-btn {
  height: 39px;
  display: flex;
  align-items: center;
  padding: 0 4px;
  gap: 8px;
  cursor: pointer;
  border-radius: 8px;
  font-family: PingFang SC;
  font-size: 14px;
  font-weight: normal;
  line-height: 22px;
  color: rgba(0, 0, 0, 0.45);

  &:hover {
    background: rgba(0, 0, 0, 0.06);
  }
}

.collapse-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  stroke: currentColor;
  stroke-width: 0;
  fill: none;
  color: rgba(0, 0, 0, 0.45);
}
</style>
