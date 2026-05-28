<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

interface FormField {
  name: string
  label: string
  type: 'input' | 'select' | 'textarea' | 'input-number'
  placeholder?: string
  readonly?: boolean
  disabled?: boolean
  options?: { value: string | number; label: string }[]
  rules?: any[]
  required?: boolean
}

interface Props {
  modelValue: Record<string, any>
  fields: FormField[]
  layout?: 'horizontal' | 'vertical'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'horizontal',
  loading: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void
  (e: 'fieldChange', field: string, value: any): void
}>()

const formRef = ref()
const contentWidth = ref(1200)
let resizeObserver: ResizeObserver | null = null

const updateContentWidth = () => {
  const el = formRef.value?.$el
  if (el) {
    contentWidth.value = el.clientWidth
  }
}

onMounted(() => {
  updateContentWidth()
  resizeObserver = new ResizeObserver(updateContentWidth)
  if (formRef.value?.$el) {
    resizeObserver.observe(formRef.value.$el)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

const colSpan = computed(() => {
  const w = contentWidth.value
  if (w < 560) return 24
  if (w < 860) return 12
  if (w < 1200) return 8
  return 6
})

function handleFieldChange(field: string, value: any) {
  props.modelValue[field] = value
  emit('fieldChange', field, value)
}

function validate() {
  return formRef.value?.validate()
}

defineExpose({
  validate,
  formRef,
})
</script>

<template>
  <a-form
    ref="formRef"
    :model="modelValue"
    :layout="layout"
    class="base-info-form"
  >
    <a-row :gutter="24">
      <a-col
        v-for="field in fields"
        :key="field.name"
        :span="colSpan"
      >
        <a-form-item
          :label="field.label"
          :name="field.name"
          :rules="field.rules"
          :required="field.required"
        >
          <a-input
            v-if="field.type === 'input'"
            v-model:value="modelValue[field.name]"
            :placeholder="field.placeholder ?? '请输入'"
            :readonly="field.readonly"
            :disabled="field.disabled"
            @update:value="(val: any) => handleFieldChange(field.name, val)"
          />
          <a-select
            v-else-if="field.type === 'select'"
            v-model:value="modelValue[field.name]"
            :placeholder="field.placeholder ?? '请选择'"
            :disabled="field.disabled"
            style="width: 100%"
            @update:value="(val: any) => handleFieldChange(field.name, val)"
          >
            <a-select-option
              v-for="opt in field.options"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </a-select-option>
          </a-select>
          <a-textarea
            v-else-if="field.type === 'textarea'"
            v-model:value="modelValue[field.name]"
            :placeholder="field.placeholder ?? '请输入'"
            :disabled="field.disabled"
            style="width: 100%"
            @update:value="(val: any) => handleFieldChange(field.name, val)"
          />
          <a-input-number
            v-else-if="field.type === 'input-number'"
            v-model:value="modelValue[field.name]"
            :placeholder="field.placeholder ?? '请输入'"
            :disabled="field.disabled"
            style="width: 100%"
            @update:value="(val: any) => handleFieldChange(field.name, val)"
          />
        </a-form-item>
      </a-col>
    </a-row>
  </a-form>
</template>

<style scoped>
.base-info-form {
  width: 100%;
}

:deep(.ant-form-item) {
  display: flex;
  flex-direction: column;
  width: 100%;
}

:deep(.ant-form-item-label) {
  width: 80px;
  flex-shrink: 0;
}

:deep(.ant-form-item-label > label) {
  justify-content: flex-end;
}
</style>
