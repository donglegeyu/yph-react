<template>
  <div class="custom-nav-panel">
    <div class="panel-header">
      <h3 class="panel-title">自定义导航栏</h3>
      <p class="panel-desc">拖拽排序，前 {{ totalCount }} 个菜单会显示在导航栏上</p>
    </div>
    <div class="panel-content">
      <div class="menu-list">
        <template v-for="(item, index) in allMenus" :key="item.key">
          <div
            v-if="index === totalCount"
            class="menu-divider"
          ></div>
          <div
            class="menu-item"
            :class="{
              'on-nav': index < totalCount,
              'dragging': dragIndex === index
            }"
            draggable="true"
            @dragstart="onDragStart($event, index)"
            @dragover="onDragOver($event, index)"
            @dragenter="onDragEnter($event, index)"
            @drop="onDrop($event, index)"
            @dragend="onDragEnd"
          >
            <div class="drag-handle">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <circle cx="8" cy="6" r="1.5" fill="currentColor"/>
                <circle cx="16" cy="6" r="1.5" fill="currentColor"/>
                <circle cx="8" cy="12" r="1.5" fill="currentColor"/>
                <circle cx="16" cy="12" r="1.5" fill="currentColor"/>
                <circle cx="8" cy="18" r="1.5" fill="currentColor"/>
                <circle cx="16" cy="18" r="1.5" fill="currentColor"/>
              </svg>
            </div>
            <div class="menu-icon">
              <svg viewBox="0 0 48 48" width="16" height="16">
                <use :href="`#${getIconName(item.icon)}`" />
              </svg>
            </div>
            <span class="menu-label">{{ item.label }}</span>
            <span v-if="index < totalCount" class="nav-badge">导航栏</span>
          </div>
        </template>
      </div>
    </div>

    <div class="panel-footer">
      <button class="btn btn-cancel" @click="handleCancel">取消</button>
      <button class="btn btn-confirm" @click="handleConfirm">确认</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

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
  totalCount: number
  selectedMenus: MenuItem[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update', selected: MenuItem[]): void
}>()

const allMenus = ref<MenuItem[]>([])

watch(() => [props.visible, props.menus], () => {
  if (props.visible && props.menus && props.menus.length > 0) {
    const safeSelectedMenus = Array.isArray(props.selectedMenus) ? props.selectedMenus : []
    const selectedKeys = new Set(safeSelectedMenus.map(m => m.key))
    
    const safeMenus = Array.isArray(props.menus) ? props.menus : []
    const menuItems: MenuItem[] = safeMenus.map(menu => ({
      key: menu.key,
      label: menu.label,
      icon: menu.icon || 'folder-open',
    }))
    
    const selectedItems = menuItems.filter(item => selectedKeys.has(item.key))
    const unselectedItems = menuItems.filter(item => !selectedKeys.has(item.key))
    
    allMenus.value = [...selectedItems, ...unselectedItems]
  } else if (!props.visible) {
    allMenus.value = []
  }
}, { immediate: true })

let dragIndex: number = -1

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

function onDragStart(event: DragEvent, index: number) {
  dragIndex = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function onDragOver(event: DragEvent, _index: number) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function onDragEnter(_event: DragEvent, index: number) {
  if (dragIndex !== -1 && dragIndex !== index) {
    const item = allMenus.value[dragIndex]
    if (item) {
      allMenus.value.splice(dragIndex, 1)
      allMenus.value.splice(index, 0, item)
      dragIndex = index
    }
  }
}

function onDrop(_event: DragEvent, _index: number) {
  _event.preventDefault()
}

function onDragEnd() {
  document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'))
  dragIndex = -1
}

function handleCancel() {
  emit('close')
}

function handleConfirm() {
  const selectedItems = allMenus.value.slice(0, props.totalCount)
  emit('update', selectedItems)
  emit('close')
}
</script>

<style scoped lang="scss">
.custom-nav-panel {
  position: fixed;
  left: 126px;
  top: 0;
  width: 320px;
  height: 100vh;
  background: #fff;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  border-radius: 0;
  overflow: hidden;
}

.panel-header {
  padding: 16px 14px 0;
  flex-shrink: 0;

  .panel-title {
    width: 96px;
    height: 24px;
    z-index: 0;
    font-family: PingFang SC;
    font-size: 16px;
    font-weight: 500;
    line-height: 24px;
    display: flex;
    align-items: flex-end;
    color: rgba(0, 0, 0, 0.88);
    margin: 0 0 4px;
  }

  .panel-desc {
    width: 292px;
    height: 22px;
    z-index: 1;
    font-family: PingFang SC;
    font-size: 14px;
    font-weight: normal;
    line-height: 22px;
    display: flex;
    align-items: flex-end;
    color: rgba(0, 0, 0, 0.45);
    margin: 0;
  }
}

.panel-content {
  width: 320px;
  height: 1080px;
  display: flex;
  flex-direction: column;
  padding: 16px 14px;
  gap: 8px;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.selected-list,
.unselected-list {
  min-height: 60px;
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.06);
  margin: 8px 0;
}

.menu-item {
  width: 292px;
  height: 40px;
  display: flex;
  align-items: center;
  padding: 2px 10px;
  margin: 0;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  cursor: grab;
  transition: all 0.2s ease;
  position: relative;
  z-index: 8;
  box-sizing: border-box;

  &:hover {
    border-color: rgba(0, 0, 0, 0.15);
  }

  &:active {
    cursor: grabbing;
  }

  &.dragging {
    opacity: 0.5;
  }

  &.selected {
    border-color: #F95914;
  }

  &.empty-slot {
    border: 1px dashed #d9d9d9;
    background: #fafafa;
    color: #bfbfbf;
    cursor: default;

    .menu-label {
      font-style: italic;
    }

    &:hover {
      border-color: #F95914;
      transform: none;
      box-shadow: none;
    }
  }

  .nav-badge {
    font-size: 10px;
    color: rgba(0, 0, 0, 0.45);
    background: rgba(0, 0, 0, 0.04);
    padding: 4px 6px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .drag-handle {
    width: 16px;
    height: 16px;
    z-index: 0;
    color: rgba(0, 0, 0, 0.45);
    flex-shrink: 0;
    margin-right: 24px;
  }

  .menu-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-right: 8px;

    svg {
      width: 16px;
      height: 16px;
      color: rgba(0, 0, 0, 0.88);
      fill: none;
    }
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

  .remove-btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #d9d9d9;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
  }
}

.empty-tip {
  font-size: 12px;
  color: #bfbfbf;
  text-align: center;
  padding: 24px 0;
}

.panel-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 14px;
  flex-shrink: 0;

  .btn {
    padding: 8px 20px;
    font-size: 14px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-cancel {
    background: #f5f5f5;
    color: rgba(0, 0, 0, 0.88);

    &:hover {
      background: #e8e8e8;
    }
  }

  .btn-confirm {
    background: #F95914;
    color: #fff;

    &:hover {
      background: #e65112;
    }
  }
}
</style>
