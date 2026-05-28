<template>
  <a-popover
    v-model:open="visible"
    trigger="click"
    placement="bottomLeft"
    :arrow="false"
    :overlay-class-name="'column-settings-popover'"
    :overlay-style="{ width: '180px', margin: '6px 0 0 0' }"
    :overlay-inner-style="{ width: '100%', maxHeight: '280px', padding: 0 }"
    :destroy-tooltip-on-hide="true"
  >
    <slot>
      <div class="icon-only-btn" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 4px; border: 1px solid #d9d9d9; background: #fff;">
        <svg viewBox="0 0 48 48" style="width: 16px; height: 16px;"><use href="#setting" /></svg>
      </div>
    </slot>
    <template #content>
      <div class="column-settings-panel">
        <!-- 搜索区域 -->
        <div class="search-area">
          <div class="search-wrapper">
            <svg class="search-icon" viewBox="0 0 48 48">
              <use href="#search" />
            </svg>
            <input
              ref="searchInputRef"
              v-model="searchKeyword"
              class="search-input"
              placeholder="搜索字段名称"
            />
          </div>
        </div>

        <!-- 字段列表 -->
        <div class="field-list">
          <div
            v-for="(field, index) in filteredFields"
            :key="field.key"
            class="field-item"
            draggable="true"
            @dragstart="handleDragStart($event, index)"
            @dragover.prevent="handleDragOver($event, index)"
            @drop="handleDrop($event, index)"
            @dragend="handleDragEnd"
          >
            <div class="field-row">
              <svg class="drag-icon" viewBox="0 0 48 48">
                <use href="#drag" />
              </svg>
              <a-checkbox
                :checked="field.visible"
                @change="(e) => handleFieldToggle(field.key, e.target.checked)"
              >
                {{ field.label }}
              </a-checkbox>
            </div>
          </div>
          <div v-if="filteredFields.length === 0" class="no-data">
            暂无数据
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <a-button size="small" @click="handleReset">重置</a-button>
          <a-button type="primary" size="small" @click="handleConfirm">确定</a-button>
        </div>
      </div>
    </template>
  </a-popover>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

interface ColumnField {
  key: string
  label: string
  visible: boolean
  width?: number
  fixed?: 'left' | 'right'
}

interface Props {
  fields: ColumnField[]
  defaultFields: ColumnField[]
  excludeKeys?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  excludeKeys: () => []
})

const emit = defineEmits<{
  (e: 'confirm', fields: ColumnField[]): void
  (e: 'reset'): void
}>()

const visible = ref(false)
const searchKeyword = ref('')
const searchInputRef = ref<HTMLInputElement>()
const localFields = ref<ColumnField[]>([])
const dragIndex = ref<number | null>(null)

const filteredFields = computed(() => {
  let fields = localFields.value.filter(field => !props.excludeKeys.includes(field.key))
  if (!searchKeyword.value) return fields
  const keyword = searchKeyword.value.toLowerCase()
  return fields.filter(field =>
    field.label.toLowerCase().includes(keyword)
  )
})

watch(() => props.fields, (newFields) => {
  localFields.value = JSON.parse(JSON.stringify(newFields))
}, { immediate: true, deep: true })

watch(visible, (newVal) => {
  if (newVal) {
    localFields.value = JSON.parse(JSON.stringify(props.fields))
    searchKeyword.value = ''
    nextTick(() => {
      searchInputRef.value?.focus()
    })
  }
})

function handleFieldToggle(key: string, checked: boolean) {
  const field = localFields.value.find(f => f.key === key)
  if (field) {
    field.visible = checked
  }
}

function handleDragStart(event: DragEvent, index: number) {
  dragIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function handleDragOver(event: DragEvent, _index: number) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function handleDrop(event: DragEvent, index: number) {
  event.preventDefault()
  if (dragIndex.value === null || dragIndex.value === index) return

  const items = localFields.value
  const dragItem = items[dragIndex.value]
  items.splice(dragIndex.value, 1)
  items.splice(index, 0, dragItem)
  dragIndex.value = null
}

function handleDragEnd() {
  dragIndex.value = null
}

function handleConfirm() {
  emit('confirm', JSON.parse(JSON.stringify(localFields.value)))
  visible.value = false
}

function handleReset() {
  localFields.value = JSON.parse(JSON.stringify(props.defaultFields))
  emit('reset')
}
</script>

<style scoped>
.column-settings-panel {
  width: 180px;
  max-height: 280px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

.search-area {
  flex-shrink: 0;
  padding: 12px 8px 0 8px;
  box-sizing: border-box;
}

.search-wrapper {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 8px;
  gap: 12px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid transparent;
  transition: all 0.2s;
  box-sizing: border-box;
}

.search-wrapper:focus-within {
  border-color: #F95914;
}

.search-icon {
  width: 16px;
  height: 16px;
  stroke: rgba(0, 0, 0, 0.65);
  stroke-width: 1.5;
  fill: none;
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
  box-sizing: border-box;
}

.search-input::placeholder {
  color: rgba(0, 0, 0, 0.25);
}

.search-input:focus {
  color: rgba(0, 0, 0, 0.85);
}

.field-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 8px;
  margin: 0;
  min-height: 0;
  box-sizing: border-box;
}

.field-list::-webkit-scrollbar {
  width: 4px;
}

.field-list::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 2px;
}

.field-list::-webkit-scrollbar-track {
  background: transparent;
}

.field-list:hover::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
}

.field-item {
  display: flex;
  flex-direction: column;
  padding: 4px 8px;
  cursor: move;
  transition: background-color 0.2s;
  box-sizing: border-box;
}

.field-item:hover {
  background-color: #f5f5f5;
  border-radius: 4px;
}

.field-item:active {
  background-color: #e6e6e6;
  border-radius: 4px;
}

.field-row {
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

.drag-icon {
  width: 12px;
  height: 12px;
  margin-right: 8px;
  color: rgba(0, 0, 0, 0.45);
  flex-shrink: 0;
  cursor: grab;
}

.drag-icon:active {
  cursor: grabbing;
}

.no-data {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.action-buttons {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #f0f0f0;
  box-sizing: border-box;
}
</style>
