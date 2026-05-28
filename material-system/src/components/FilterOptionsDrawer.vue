<template>
  <a-drawer
    v-model:open="visible"
    :title="isEditMode ? '编辑视图' : '新增视图'"
    :width="380"
    :footer-style="{ textAlign: 'right' }"
    @close="handleClose"
  >
    <div class="drawer-content">
      <div class="view-name-section">
        <div class="field-label">
          视图名称
          <span class="required-star">*</span>
        </div>
        <a-input
          v-model:value="schemeName"
          placeholder="请输入视图名称（最多8个字）"
          :maxlength="8"
          show-count
        />
      </div>

      <div class="view-name-hint">勾选并调整视图条件顺序后保存</div>
    
      <div class="filter-list-container">
        <div
          v-for="(item, index) in localDialogOptions"
          :key="item.key"
          class="filter-item"
          draggable="true"
          @dragstart="handleDragStart($event, index)"
          @dragover.prevent="handleDragOver($event, index)"
          @drop="handleDrop($event, index)"
          @dragend="handleDragEnd"
        >
          <div class="filter-row">
            <svg class="drag-icon" viewBox="0 0 48 48">
              <use href="#drag" />
            </svg>
            <a-checkbox 
              :checked="item.checked" 
              @change="(e: any) => handleCheckedChange(index, e.target.checked)"
            >
              {{ item.label }}
            </a-checkbox>
          </div>
          <div class="default-value-row" v-if="item.checked">
            <a-select
              v-if="item.options"
              :value="item.defaultValue || ''"
              @change="(val: any) => handleDefaultValueChange(index, val)"
              :options="item.options"
              placeholder="默认值"
              style="width: 100%;"
              allow-clear
            />
            <a-input
              v-else-if="item.key === 'dateRange'"
              :value="item.defaultValue || ''"
              @input="(e: any) => handleDefaultValueChange(index, e.target.value)"
              placeholder="默认日期"
              style="width: 100%;"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <a-button @click="handleClose">取消</a-button>
      <a-button type="primary" @click="handleSave" style="margin-left: 8px">
        保存
      </a-button>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

interface FilterOption {
  key: string
  label: string
  checked: boolean
  options?: Array<{ label: string; value: string }>
  defaultValue?: any
}

interface Props {
  open: boolean
  options: FilterOption[]
  isEdit?: boolean
  editName?: string
  editId?: string
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  isEdit: false,
  editName: '',
  editId: ''
})

const emit = defineEmits(['update:open', 'save', 'close'])

const visible = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

const isEditMode = computed(() => props.isEdit)
const schemeName = ref(props.editName)
const editingId = ref(props.editId)

// 本地副本，用于编辑
const localDialogOptions = ref<FilterOption[]>([])

// 拖拽状态
const dragIndex = ref<number | null>(null)

// 监听 open 变化，同步选项
watch(() => props.open, (newVal) => {
  if (newVal) {
    // 打开抽屉时，复制选项到本地
    localDialogOptions.value = props.options.map(opt => ({
      key: opt.key,
      label: opt.label,
      checked: opt.checked,
      options: opt.options ? [...opt.options] : undefined,
      defaultValue: opt.defaultValue
    }))
    // 设置编辑模式的值
    schemeName.value = props.editName
    editingId.value = props.editId
  }
})

// 监听 props.options 变化（用于同步外部变化）
watch(() => props.options, (newVal) => {
  if (props.open && localDialogOptions.value.length === 0) {
    localDialogOptions.value = newVal.map(opt => ({
      key: opt.key,
      label: opt.label,
      checked: opt.checked,
      options: opt.options ? [...opt.options] : undefined,
      defaultValue: opt.defaultValue
    }))
  }
}, { deep: true })

function handleClose() {
  emit('close')
  emit('update:open', false)
}

function handleSave() {
  if (!schemeName.value.trim()) {
    return
  }
  
  const selectedCount = localDialogOptions.value.filter(opt => opt.checked).length
  if (selectedCount === 0) {
    return
  }
  
  emit('save', {
    name: schemeName.value.trim(),
    id: editingId.value,
    options: [...localDialogOptions.value]
  })
  
  emit('update:open', false)
}

function handleCheckedChange(index: number, checked: boolean) {
  if (localDialogOptions.value[index]) {
    localDialogOptions.value[index].checked = checked
  }
}

function handleDefaultValueChange(index: number, value: any) {
  if (localDialogOptions.value[index]) {
    localDialogOptions.value[index].defaultValue = value
  }
}

// 拖拽相关
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
  
  const items = localDialogOptions.value
  const dragItem = items[dragIndex.value]
  items.splice(dragIndex.value, 1)
  items.splice(index, 0, dragItem)
  dragIndex.value = null
}

function handleDragEnd() {
  dragIndex.value = null
}
</script>

<style scoped lang="scss">
.drawer-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.view-name-section {
  .field-label {
    font-size: 14px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.85);
    margin-bottom: 8px;
    
    .required-star {
      color: #ff4d4f;
      margin-left: 4px;
    }
  }
}

.view-name-hint {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 8px;
}

.filter-list-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-item {
  background: #fafafa;
  border-radius: 4px;
  padding: 12px;
  cursor: move;
  transition: background-color 0.2s;
  
  &:hover {
    background: #f0f0f0;
  }
  
  &.dragging {
    opacity: 0.5;
    background: #e6f7ff;
  }
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drag-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  cursor: grab;
  color: rgba(0, 0, 0, 0.25);
  
  &:active {
    cursor: grabbing;
  }
}

.default-value-row {
  margin-top: 8px;
  margin-left: 24px;
}
</style>
