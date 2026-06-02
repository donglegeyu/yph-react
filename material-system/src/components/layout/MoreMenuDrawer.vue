<template>
  <div class="more-panel">
    <!-- 搜索区域（顶部横条） -->
    <div class="search-area">
      <div class="search-wrapper">
        <input
          ref="searchInputRef"
          v-model="searchKeyword"
          class="search-input"
          placeholder="请输入关键词搜索应用和菜单"
        />
        <svg class="search-icon" viewBox="0 0 48 48">
          <use href="#search" />
        </svg>
      </div>
      <svg class="close-btn" viewBox="0 0 48 48" @click="handleClose">
        <path d="M12 12l24 24M36 12L12 36" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      </svg>
    </div>

    <!-- 左右内容区 -->
    <div class="content-area">
      <!-- 左侧一级菜单列表 -->
      <div class="menu-left">
        <div
          v-for="menu in filteredMenus"
          :key="menu.key"
          class="menu-item"
          :class="{ active: selectedKey === menu.key }"
          @click="handleSelect(menu)"
        >
          <svg class="menu-icon" viewBox="0 0 48 48">
            <use :href="`#${getIconName(menu.icon)}`" />
          </svg>
          <span class="menu-label">{{ menu.label }}</span>
        </div>
        <div v-if="filteredMenus.length === 0" class="no-data">
          暂无数据
        </div>
        <!-- 自定义导航栏区域 -->
        <div class="custom-nav-section">
          <div class="custom-nav-divider"></div>
          <div class="custom-nav-btn" @click="handleCustomNav">
            <svg class="icon" viewBox="0 0 48 48">
              <use href="#setting" />
            </svg>
            <span>自定义导航栏</span>
          </div>
        </div>
      </div>

      <!-- 右侧二/三级菜单 -->
      <div class="menu-right">
        <template v-if="selectedMenu">
          <div
            v-for="child in selectedMenu.children"
            :key="child.key"
            class="menu-section"
          >
            <!-- 二级标题 -->
            <div class="section-title">
              <div class="title-bar"></div>
              <span class="title-text">{{ child.label }}</span>
            </div>
            <!-- 三级菜单 -->
            <div v-if="child.children && child.children.length > 0" class="level-3">
              <div
                v-for="grandChild in child.children"
                :key="grandChild.key"
                class="menu-item"
                @click="handleChildClick(grandChild, child)"
              >
                <span class="menu-label">{{ grandChild.label }}</span>
                <svg 
                  class="star-icon"
                  :class="{ 'is-favorited': appStore.isFavorited(grandChild.key) }"
                  viewBox="0 0 24 24"
                  @click.stop="handleToggleFavorite(grandChild)"
                >
                  <use href="#star-fill" class="star-fill" />
                  <use href="#star" class="star-outline" />
                </svg>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="no-data">
          请选择左侧菜单
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

interface MenuItem {
  key: string
  label: string
  icon?: string
  path?: string
  children?: MenuItem[]
}

const props = defineProps<{
  visible: boolean
  menus: MenuItem[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', menu: MenuItem): void
  (e: 'openCustomNav'): void
}>()

const router = useRouter()
const appStore = useAppStore()
const activeKey = computed(() => appStore.activeKey)
const searchKeyword = ref('')
const selectedKey = ref('')
const selectedMenu = ref<MenuItem | null>(null)
const searchInputRef = ref<HTMLInputElement>()

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

function getIconName(icon?: string): string {
  return icon ? iconMap[icon] || icon : 'id-card-v-klbe0a04'
}

const filteredMenus = computed(() => {
  if (!searchKeyword.value) return props.menus
  const keyword = searchKeyword.value.toLowerCase()
  return props.menus.filter(menu =>
    menu.label.toLowerCase().includes(keyword) ||
    menu.children?.some(child => child.label.toLowerCase().includes(keyword))
  )
})

function handleSelect(menu: MenuItem) {
  selectedKey.value = menu.key
  selectedMenu.value = menu
}

function handleChildClick(child: MenuItem, parentMenu?: MenuItem) {
  if (child.path) {
    // 同步菜单状态：一级选中、二级展开、三级选中
    const firstKey = selectedKey.value
    if (firstKey) {
      appStore.activeFirstMenu = firstKey
      // 如果一级菜单不在导航栏显示，自动提升到末尾
      appStore.promoteToNav(firstKey)
    }
    // 设置二级菜单展开和三级选中（保留用户已展开的菜单）
    if (parentMenu && !appStore.expandedKeys.includes(parentMenu.key)) {
      appStore.expandedKeys = [...appStore.expandedKeys, parentMenu.key]
    }
    appStore.activeKey = child.key
    // 打开二级面板
    if (!appStore.secondSidebarFixed) {
      appStore.secondSidebarHovered = true
    }
    router.push(child.path)
    emit('close')
  } else if (child.children && child.children.length > 0) {
    // 有三级菜单，展开三级
  } else {
    emit('select', child)
    emit('close')
  }
}

function handleToggleFavorite(menu: MenuItem) {
  appStore.toggleFavorite(menu)
}

function handleClose() {
  searchKeyword.value = ''
  selectedKey.value = ''
  selectedMenu.value = null
  emit('close')
}

function handleCustomNav() {
  emit('openCustomNav')
  emit('close')
}

watch(() => props.visible, (newVal) => {
  if (newVal && props.menus.length > 0) {
    const firstMenu = props.menus[0]
    selectedKey.value = firstMenu.key
    selectedMenu.value = firstMenu
    setTimeout(() => {
      searchInputRef.value?.focus()
    }, 100)
  }
}, { immediate: true })

// 监听关闭事件重置状态
defineExpose({ handleClose })
</script>

<style scoped lang="scss">
.more-panel {
  position: fixed;
  left: 126px;
  top: 0;
  width: 816px;
  height: 100vh;
  background: #fff;
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  border-radius: 8px 0 0 8px;
  overflow: hidden;
}

.search-area {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  gap: 12px;
  z-index: 1;
}

.search-wrapper {
  width: 310px;
  height: 32px;
  display: flex;
  align-items: center;
  padding: 5px 12px;
  gap: 12px;
  z-index: 0;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.02);
  transition: all 0.2s;

  &:focus-within {
    border: 1px solid #F95914;
  }
}

.search-icon {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  stroke-width: 1.5;
  fill: none;
  color: rgba(0, 0, 0, 0.65);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  height: 32px;
  border: none;
  background: transparent;
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  line-height: 32px;
  outline: none;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Helvetica, Arial, sans-serif;

  &::placeholder {
    color: rgba(0, 0, 0, 0.25);
  }

  &:focus {
    color: rgba(0, 0, 0, 0.85);
  }
}

.close-btn {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.65);
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    color: rgba(0, 0, 0, 0.85);
    background: rgba(0, 0, 0, 0.06);
  }
}

.content-area {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.menu-left {
  width: 201px;
  flex-shrink: 0;
  border-right: 1px solid #f0f0f0;
  overflow-y: auto;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  .menu-item {
    width: 100%;
    height: 40px;
    padding: 0 16px;
    margin: 0;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
    align-self: stretch;
    z-index: 0;
    cursor: pointer;
    color: rgba(0, 0, 0, 0.88);
    transition: all 0.2s;
    box-sizing: border-box;

    &:hover {
      background: #fafafa;
      color: rgba(0, 0, 0, 0.88);
    }

    &.active {
      background: #FFF1E6;
      z-index: 1;
      color: #F95914;

      .menu-icon {
        color: #F95914;
      }
    }

    .menu-icon {
      width: 16px;
      height: 16px;
      z-index: 0;
      stroke: currentColor;
      fill: currentColor;
      flex-shrink: 0;
    }

    .menu-label {
      flex: 1;
      height: 22px;
      z-index: 1;
      font-family: PingFang SC;
      font-size: 14px;
      font-weight: normal;
      line-height: 22px;
      color: rgba(0, 0, 0, 0.88);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .menu-item.active {
    .menu-label {
      color: #F95914;
    }
  }

  .custom-nav-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: auto;
  }

  .custom-nav-divider {
    height: 1px;
    background: #f0f0f0;
    margin: 4px 0;
  }

  .custom-nav-btn {
    width: 168px;
    height: 40px;
    display: flex;
    align-items: center;
    padding: 2px 4px;
    gap: 4px;
    z-index: 1;
    border-radius: 2px;
    cursor: pointer;
    color: #999;
    font-size: 14px;
    flex-shrink: 0;
    transition: all 0.2s;
    box-sizing: border-box;

    &:hover {
      color: #666;
      background: #fafafa;
    }

    .icon {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
  }
}

.menu-right {
  flex: 1;
  overflow-y: auto;
  padding: 0px 16px;
}

.menu-section {
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  width: 583px;
  height: 38px;
  display: flex;
  align-items: center;
  padding: 8px 0px;
  gap: 10px;
  align-self: stretch;
  z-index: 0;

  .title-bar {
    width: 4px;
    height: 16px;
    z-index: 0;
    border-radius: 12px;
    background: #F95914;
  }

  .title-text {
    font-family: PingFang SC;
    font-size: 14px;
    font-weight: normal;
    line-height: 22px;
    letter-spacing: normal;
    color: rgba(0, 0, 0, 0.88);
  }
}

.level-3 {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-left: 0px;

  .menu-item {
    width: 184px;
    height: 28px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 12px;
    margin: 0;
    border-radius: 4px;
    cursor: pointer;
    color: rgba(0, 0, 0, 0.88);
    font-size: 14px;
    line-height: 18px;
    transition: all 0.2s;
    z-index: 3;
    box-sizing: border-box;

    &:hover {
      background: rgba(0, 0, 0, 0.04);

      .star-icon {
        .star-outline {
          opacity: 1;
        }
      }
    }

    .menu-label {
      font-family: PingFang SC;
      font-size: 14px;
      font-weight: normal;
      line-height: 18px;
      letter-spacing: normal;
      color: rgba(0, 0, 0, 0.88);
      flex: 1;
    }

    .star-icon {
      width: 14px;
      height: 14px;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
      z-index: 2;

      .star-fill {
        opacity: 0;
        stroke: none !important;
        color: rgba(0, 0, 0, 0.45);
      }

      .star-outline {
        opacity: 0;
        color: rgba(0, 0, 0, 0.45);
      }

      &.is-favorited {
        .star-fill {
          opacity: 1;
        }
        .star-outline {
          opacity: 0;
        }
      }
    }
  }
}

.no-data {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
</style>
