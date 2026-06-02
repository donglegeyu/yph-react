<template>
  <a-select
    v-model:value="selectValue"
    :placeholder="placeholder"
    :size="size"
    style="width: 100%"
    allow-clear
    show-search
    :filter-option="false"
    :search-value="searchText"
    :popup-match-select-width="false"
    @search="handleSearch"
    @change="(val: any) => handleChange(val)"
  >
    <!-- @vue-ignore -->
    <template #label>
      <div class="icon-selected" v-if="selectValue">
        <svg viewBox="0 0 48 48" class="icon-selected-preview">
          <use :href="`#${getIconName(selectValue)}`" />
        </svg>
      </div>
    </template>
    <a-select-option v-for="icon in filteredIconList" :key="icon.value" :value="icon.value">
      <div class="icon-option">
        <svg viewBox="0 0 48 48" class="icon-preview">
          <use :href="`#${getIconName(icon.value)}`" />
        </svg>
        <span class="icon-label">{{ icon.label }}</span>
      </div>
    </a-select-option>
    <template #dropdownRender="{ menuNode: menu }">
      <component :is="menu" />
      <div class="icon-add-divider" />
      <div class="icon-add-btn" @click="showAddModal = true">
        <span>+ 添加自定义图标</span>
      </div>
    </template>
  </a-select>

  <a-modal
    v-model:open="showAddModal"
    title="添加自定义图标"
    :width="480"
    @ok="handleAddIcon"
    @cancel="closeAddModal"
  >
    <a-form layout="vertical">
      <a-form-item label="图标名称" required>
        <a-input v-model:value="newIcon.label" placeholder="例如：我的图标" />
      </a-form-item>
      <a-form-item label="图标标识" required>
        <a-input v-model:value="newIcon.value" placeholder="例如：my-icon" />
        <div class="form-tip">用于引用图标的唯一标识，只能是英文、数字、连字符</div>
      </a-form-item>
      <a-form-item label="SVG Symbol URL" required>
        <a-input v-model:value="newIcon.svgUrl" placeholder="https://lf1-cdn-tos.bytegoofy.com/obj/iconpark/svg_xxx.js" />
        <div class="form-tip">IconPark 的 SVG Symbol JS 文件地址，会自动从中提取图标</div>
      </a-form-item>
      <a-form-item label="预览">
        <div v-if="newIcon.svgUrl && newIcon.value" class="icon-preview-box">
          <svg viewBox="0 0 48 48" class="icon-preview-large">
            <use :href="`#${getIconName(newIcon.value)}`" />
          </svg>
          <span class="preview-tip">如果预览为空，说明图标标识不存在</span>
        </div>
        <div v-else class="icon-preview-empty">
          <span>请填写完整信息后预览</span>
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed, reactive, shallowRef } from 'vue'
import { message } from 'ant-design-vue'
import { ICON_API } from '@/constants/api'

const props = withDefaults(defineProps<{
  modelValue?: string
  value?: string
  placeholder?: string
  size?: 'small' | 'middle' | 'large'
}>(), {
  size: 'middle'
})

const propsValue = computed(() => props.modelValue || props.value)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:value': [value: string]
}>()

const selectValue = ref<string | undefined>(propsValue.value || undefined)
const searchText = ref('')
const showAddModal = ref(false)

watch(() => propsValue.value, (val) => {
  selectValue.value = val || undefined
})

const newIcon = reactive({
  label: '',
  value: '',
  svgUrl: ''
})

// 图标名称映射（将不存在的图标名映射到 CDN/本地存在的图标）
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

function getIconName(icon: string): string {
  return iconMap[icon] || icon
}

const loadedScripts = shallowRef<Set<string>>(new Set())

const presetIcons = ref<Array<{ value: string; label: string }>>([])
const customIcons = ref<Array<{ value: string; label: string }>>([])

async function loadIconConfig() {
  try {
    const res = await fetch(ICON_API.BASE)
    const text = await res.text()
    if (!text.trim()) {
      return
    }
    const json = JSON.parse(text)
    if (json.code === 200 && json.data) {
      presetIcons.value = json.data.preset || []
      customIcons.value = json.data.custom || []
    }
  } catch (e) {
    console.error('[IconSelect] loadIconConfig 失败:', e)
  }
}

async function saveIconConfig() {
  try {
    const payload = {
      preset: presetIcons.value,
      custom: customIcons.value
    }
    console.log('[IconSelect] saveIconConfig - 保存数据:', JSON.stringify(payload))
    const res = await fetch(ICON_API.BASE, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const json = await res.json()
    console.log('[IconSelect] saveIconConfig - 后端响应:', json)
  } catch (e) {
    console.error('[IconSelect] saveIconConfig 失败:', e)
  }
}

loadIconConfig()

const iconList = computed(() => {
  return [...presetIcons.value, ...customIcons.value]
})

function handleSearch(value: string) {
  searchText.value = value
}

function handleChange(value: string | number) {
  searchText.value = ''
  const val = String(value)
  emit('update:modelValue', val)
  emit('update:value', val)
}

const filteredIconList = computed(() => {
  if (!searchText.value) return iconList.value
  const search = searchText.value.toLowerCase()
  return iconList.value.filter(icon =>
    icon.label.toLowerCase().includes(search) ||
    icon.value.toLowerCase().includes(search)
  )
})

async function loadSvgScript(url: string): Promise<boolean> {
  if (loadedScripts.value.has(url)) {
    return true
  }

  try {
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(`script[src="${url}"]`)
      if (existing) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = url
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('加载失败'))
      document.body.appendChild(script)
    })

    loadedScripts.value.add(url)
    return true
  } catch (e) {
    return false
  }
}

async function handleAddIcon() {
  if (!newIcon.label.trim()) {
    message.error('请输入图标名称')
    return
  }
  if (!newIcon.value.trim()) {
    message.error('请输入图标标识')
    return
  }
  if (!newIcon.svgUrl.trim()) {
    message.error('请输入 SVG Symbol URL')
    return
  }

  const valueRegex = /^[a-zA-Z0-9-_]+$/
  if (!valueRegex.test(newIcon.value)) {
    message.error('图标标识只能包含英文、数字、连字符和下划线')
    return
  }

  if (presetIcons.value.some(i => i.value === newIcon.value) || customIcons.value.some(i => i.value === newIcon.value)) {
    message.error('该图标标识已存在')
    return
  }

  const loaded = await loadSvgScript(newIcon.svgUrl)
  if (!loaded) {
    message.error('SVG Symbol URL 加载失败，请检查链接是否正确')
    return
  }

  const newIconData = {
    value: newIcon.value,
    label: newIcon.label
  }

  customIcons.value.push(newIconData)
  await saveIconConfig()

  message.success('图标添加成功')
  closeAddModal()
}

async function handleDeleteIcon(iconValue: string) {
  const presetIndex = presetIcons.value.findIndex(i => i.value === iconValue)
  if (presetIndex !== -1) {
    presetIcons.value.splice(presetIndex, 1)
  } else {
    const customIndex = customIcons.value.findIndex(i => i.value === iconValue)
    if (customIndex !== -1) {
      customIcons.value.splice(customIndex, 1)
    }
  }

  try {
    await saveIconConfig()
    if (selectValue.value === iconValue) {
      emit('update:modelValue', '')
    }
    message.success('图标已删除')
  } catch (e) {
    await loadIconConfig()
    message.error('删除失败，请重试')
  }
}

function closeAddModal() {
  showAddModal.value = false
  newIcon.label = ''
  newIcon.value = ''
  newIcon.svgUrl = ''
}
</script>

<style scoped>
.icon-selected {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  line-height: 1;
}

.icon-selected-preview {
  width: 16px;
  height: 16px;
  display: inline-block;
  vertical-align: middle;
}

.icon-option {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  height: 100%;
  min-height: 32px;
  box-sizing: border-box;
}

.icon-preview {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-preview svg {
  width: 18px;
  height: 18px;
}

.icon-label {
  font-size: 13px;
  line-height: 1;
}

.icon-add-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 4px 0;
}

.icon-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  color: #F95914;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.icon-add-btn:hover {
  color: #FF7043;
  background-color: #FBE9E7;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.icon-preview-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
}

.icon-preview-large {
  width: 48px;
  height: 48px;
  stroke: currentColor;
  fill: none;
}

.preview-tip {
  font-size: 12px;
  color: #999;
}

.icon-preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #fafafa;
  border-radius: 4px;
  color: #999;
  font-size: 13px;
}
</style>
