<template>
  <div class="tab-bar">
    <div class="tab-list">
      <div class="tab-item home-tab" :class="{ active: isHome }" @click="goHome">
        <span class="tab-label">首页</span>
      </div>
      <div
        v-for="tab in tabs.filter(t => t.key !== 'home')"
        :key="tab.key"
        class="tab-item"
        :class="{ active: activeTabKey === tab.key }"
        @click="goTab(tab)"
      >
        <span class="tab-label">{{ getTabLabel(tab.key, tab.label) }}</span>
        <svg class="tab-close" viewBox="0 0 48 48" @click.stop="handleCloseTab(tab.key)">
          <use href="#close" />
        </svg>
      </div>
    </div>
    <div class="tab-actions">
      <a-tooltip title="全屏">
        <svg class="action-icon" viewBox="0 0 48 48">
          <use href="#fullscreen" />
        </svg>
      </a-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const { tabs, activeTabKey } = storeToRefs(appStore)

function getTabLabel(key: string, fallback: string): string {
  const label = appStore.getMenuLabelByKey(key)
  return label || fallback
}

const isHome = computed(() => route.path === '/home' || route.path === '/')

// 页面加载时根据路由设置选中 tab
watch(() => route.path, (path) => {
  if (path === '/home' || path === '/') {
    activeTabKey.value = ''
  } else {
    const tab = tabs.value.find(t => t.path === path)
    if (tab) {
      activeTabKey.value = tab.key
    }
  }
}, { immediate: true })

function goHome() {
  activeTabKey.value = ''
  // 切换到首页，重置所有菜单状态
  appStore.activeFirstMenu = 'home'
  appStore.activeKey = ''
  appStore.expandedKeys = []
  appStore.secondSidebarHovered = false
  router.push('/home')
}

function goTab(tab: { key: string; path: string }) {
  activeTabKey.value = tab.key
  
  const isMenuPath = Object.values(appStore.secondMenusMap).some(menus =>
    menus.some(menu => menu.path === tab.path ||
      menu.children?.some(child => child.path === tab.path))
  )
  
  if (isMenuPath) {
    appStore.syncMenuState(tab.key, tab.path)
  } else {
    appStore.activeFirstMenu = ''
    appStore.activeKey = ''
    appStore.clearExpandedKeys()
    appStore.secondSidebarHovered = false
  }
  
  router.push(tab.path)
}

function handleCloseTab(key: string) {
  const next = appStore.closeTab(key)
  if (next) {
    router.push(next.path)
  }
}
</script>

<style scoped lang="scss">
.tab-bar {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  flex-shrink: 0;
  background: transparent;
}

.tab-list {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }
}

.tab-item {
  position: relative;
  height: 1.75rem;
  display: flex;
  align-items: center;
  padding: 0.19rem 0.5rem;
  gap: 0.375rem;
  z-index: 1;
  border-radius: 0.25rem;
  background: #F2F1F0;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;

  &:hover {
    background: #F5F5F5;

    .tab-close {
      opacity: 1;
    }
  }

  &.active {
    z-index: 2;
    background: #F0EEED;

    .tab-label {
      font-family: PingFang SC;
      font-size: 14px;
      font-weight: normal;
      line-height: 1.38rem;
      color: var(--ant-color-text-heading);
    }

    .tab-close {
      width: 0.75rem;
      height: 0.75rem;
      z-index: 1;
    }
  }

  &.home-tab {
    &.active .tab-label {
      color: var(--ant-color-text-heading);
    }
  }
}

.tab-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
  white-space: nowrap;
  margin-right: 6px;
}

.tab-close {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
  color: rgba(0, 0, 0, 0.45);
}

.tab-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
}

.action-icon {
  width: 18px;
  height: 18px;
  color: rgba(0, 0, 0, 0.45);
  cursor: pointer;

  &:hover {
    color: rgba(0, 0, 0, 0.88);
  }
}
</style>
