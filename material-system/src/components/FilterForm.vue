<template>
  <div class="filter-form" @keydown.enter="handleSearch">
    <a-row :gutter="24">
      <template v-for="(item, index) in displayItems" :key="item.key || index">
        <!-- 按钮，右对齐 -->
        <a-col
          v-if="item.type === 'button'"
          :style="{ marginLeft: 'auto' }"
          class="btn-col"
        >
          <a-form-item class="filter-item">
            <a-space :size="12">
              <a-button type="primary" @click="handleSearch">查询</a-button>
              <a-button @click="handleReset">重置</a-button>
              <span v-if="needExpand" @click="toggleExpand" class="expand-btn">
                <span class="expand-text">{{ expanded ? '收起' : '展开' }}</span>
                <svg class="arrow-icon" viewBox="0 0 48 48" style="width:14px;height:14px">
                  <use :href="expanded ? '#up' : '#down'" />
                </svg>
              </span>
            </a-space>
          </a-form-item>
        </a-col>
        
        <a-col v-else-if="item.type === 'item'" v-bind="colSpans" class="filter-col">
          <a-form-item :label="item.label" class="filter-item">
            <a-input
              v-if="item.inputType === 'input'"
              :value="formModel[item.key] as string"
              @input="(e: Event) => formModel[item.key] = (e.target as HTMLInputElement).value"
              :placeholder="item.placeholder || '请输入'"
            />
            <a-select
              v-else-if="item.inputType === 'select'"
              :value="formModel[item.key] as string | number | undefined"
              @change="(val) => formModel[item.key] = val"
              :placeholder="item.placeholder || '请选择'"
              :options="item.options || []"
              allow-clear
            />
            <a-date-picker
              v-else-if="item.inputType === 'date'"
              :value="formModel[item.key] as dayjs.Dayjs | string | undefined"
              @change="(_val, dateString) => formModel[item.key] = dateString"
              style="width: 100%"
            />
            <a-range-picker
              v-else-if="item.inputType === 'daterange'"
              :value="formModel[item.key] as [dayjs.Dayjs, dayjs.Dayjs] | undefined"
              @change="(_val, dateStrings) => formModel[item.key] = dateStrings"
              style="width: 100%"
              :placeholder="['开始日期', '结束日期']"
              :presets="presets"
            />
          </a-form-item>
        </a-col>
      </template>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import type { FilterItem, DisplayItem } from '@/types'

const presets = [
  { label: '近一周', value: [dayjs().subtract(1, 'week'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: '近一月', value: [dayjs().subtract(1, 'month'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: '近三月', value: [dayjs().subtract(3, 'month'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: '近一年', value: [dayjs().subtract(1, 'year'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] }
]

interface Props {
  modelValue?: Record<string, unknown>
  items?: FilterItem[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  items: () => [],
})

const emit = defineEmits(['update:modelValue', 'search', 'reset', 'change'])
const contentWidth = ref(1200)
const expanded = ref(false)
const defaultRowCount = 2 // 默认显示两行

// 动态计算列数（基于内容区域宽度）
const colSpans = computed(() => {
  const w = contentWidth.value
  if (w < 560) return { xs: 24 } // 1列
  if (w < 860) return { xs: 24, sm: 12 } // 2列
  if (w < 1200) return { xs: 24, sm: 12, md: 8 } // 3列
  return { xs: 24, sm: 12, md: 8, lg: 6 } // 4列
})

// 每行显示的列数
const colsPerRow = computed(() => {
  const spans = colSpans.value
  if (spans.lg) return 4
  if (spans.md) return 3
  if (spans.sm) return 2
  return 1
})

// 是否需要显示展开/收起按钮
const needExpand = computed(() => {
  return props.items.length > defaultRowCount * colsPerRow.value
})

// 实际显示的筛选项
// 收起时：2行 × 列数 - 1（按钮占1格）
// 展开时：显示全部
const visibleItems = computed(() => {
  if (expanded.value) return props.items
  const maxItems = 2 * colsPerRow.value - 1 // 3列时=5, 2列时=3, 1列时=1
  return props.items.slice(0, maxItems)
})

// 用于渲染的完整项目列表（筛选项 + 占位列 + 按钮）- placeholder 全局 fallback
const displayItems = computed<DisplayItem[]>(() => {
  const items = visibleItems.value
  // 筛选项 + 按钮，按钮使用 margin-left: auto 右对齐
  return [
    ...items.map(item => ({
      key: item.key,
      label: item.label,
      type: 'item',
      inputType: item.type,
      placeholder: item.placeholder || (item.type === 'select' ? '请选择' : '请输入'),
      options: item.options,
    })),
    { key: 'btn', type: 'button' },
  ]
})

// 计算内容区域宽度（使用 filter-form 自身宽度）
function updateContentWidth() {
  const filterForm = document.querySelector('.filter-form')
  // 使用 filter-form 的父元素宽度（已包含自身 padding）
  const parentWidth = filterForm?.parentElement?.clientWidth || window.innerWidth
  contentWidth.value = parentWidth
}

onMounted(() => {
  updateContentWidth()
  window.addEventListener('resize', updateContentWidth)
  // 监听侧边栏变化
  const observer = new MutationObserver(updateContentWidth)
  const mainContent = document.querySelector('.main-content')
  if (mainContent) observer.observe(mainContent, { attributes: true, attributeFilter: ['class'] })
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContentWidth)
})

const formModel = reactive<Record<string, unknown>>({})

watch(() => props.items, (items) => {
  if (items && items.length > 0) {
    items.forEach((item: FilterItem) => {
      if (item.key && item.type !== 'button') {
        // 根据字段类型设置正确的初始值
        if (item.type === 'daterange') {
          // 日期范围需要初始化为空数组
          formModel[item.key] = props.modelValue?.[item.key] || []
        } else if (item.type === 'select') {
          // 下拉选择初始值设为 undefined，这样 placeholder 可以显示
          const val = props.modelValue?.[item.key]
          formModel[item.key] = val !== undefined ? val : undefined
        } else {
          // 其他类型初始化为空字符串
          formModel[item.key] = props.modelValue?.[item.key] || ''
        }
      }
    })
  }
}, { immediate: true, deep: true })

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    Object.keys(formModel).forEach(key => {
      const newValue = newVal[key]
      const oldValue = formModel[key]
      
      // 如果值相同，跳过更新，避免循环
      if (JSON.stringify(newValue) === JSON.stringify(oldValue)) {
        return
      }
      
      // 查找字段类型
      const item = props.items?.find((i: FilterItem) => i.key === key)
      const fieldType = item?.type || 'input'
      
      if (newValue !== undefined) {
        formModel[key] = newValue
      } else {
        // 根据字段类型设置正确的初始值
        if (fieldType === 'daterange') {
          formModel[key] = []
        } else if (fieldType === 'select') {
          formModel[key] = undefined
        } else {
          formModel[key] = ''
        }
      }
    })
  }
}, { deep: true })

watch(formModel, () => {
  const data = JSON.parse(JSON.stringify(formModel))
  emit('update:modelValue', data)
  emit('change', data)
}, { deep: true })

function handleSearch() {
  const searchData: Record<string, unknown> = {}
  Object.keys(formModel).forEach(key => {
    const val = formModel[key]
    if (val !== undefined && val !== null && val !== '') {
      searchData[key] = val
    }
  })
  console.log('[FilterForm] handleSearch, formModel:', JSON.stringify(formModel))
  console.log('[FilterForm] handleSearch, searchData:', JSON.stringify(searchData))
  emit('search', searchData)
}

function handleReset() {
  Object.keys(formModel).forEach(key => {
    formModel[key] = ''
  })
  emit('reset')
}

function toggleExpand() {
  expanded.value = !expanded.value
}
</script>

<style scoped lang="scss">
.filter-form {
  background: #fff;
  padding: 0.625rem 0.75rem;
  border-radius: 0.38rem;
}

.filter-item {
  display: flex;
  flex-direction: column;
  width: 100%;

  :deep(.ant-form-item-label) {
    width: 80px;
    flex-shrink: 0;

    > label {
      justify-content: flex-end;
      width: 100%;
    }
  }

  :deep(.ant-form-item-control) {
    flex: 1;
    min-width: 0;
  }

  :deep(.ant-input),
  :deep(.ant-select),
  :deep(.ant-picker) {
    width: 100%;
  }
}

.filter-col {
  margin-bottom: 0;
}

:deep(.ant-form-item) {
  margin-bottom: 0;
}

:deep(.ant-input),
:deep(.ant-select-selector),
:deep(.ant-picker),
:deep(.ant-form-item-label > label) {
  margin: 6px 0;
}

:deep(.ant-select-selection-item) {
  color: rgba(0, 0, 0, 0.85);
}

.btn-col {
  display: flex;
  justify-content: flex-end;

  :deep(.ant-form-item) {
    margin-bottom: 0;
  }

  :deep(.ant-space) {
    display: flex;
    justify-content: flex-end;
  }

  :deep(.ant-space-item) {
    margin: 6px 0;
  }

  :deep(.ant-btn) {
    box-shadow: none;
  }
}

:deep(.expand-btn) {
  width: auto;
  height: 22px;
  display: flex;
  align-items: center;
  padding: 0;
  gap: 4px;
  font-family: PingFang SC;
  font-size: 14px;
  font-weight: normal;
  line-height: 22px;
  color: rgba(0, 0, 0, 0.88);

  &:hover {
    color: rgba(0, 0, 0, 0.88);
  }

  &:active {
    color: rgba(0, 0, 0, 0.88) !important;
  }

  &:focus {
    color: rgba(0, 0, 0, 0.88) !important;
    outline: none !important;
    box-shadow: none !important;
  }

  .arrow-icon {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .expand-text {
    color: rgba(0, 0, 0, 0.88) !important;
  }
}
</style>
