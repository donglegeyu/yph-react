<template>
  <a-select
    v-model:value="modelValue"
    :options="options"
    :mode="mode"
    :placeholder="placeholder"
    :show-search="showSearch"
    :allow-clear="allowClear"
    style="width: 400px"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Option {
  label: string
  value: string | number
}

const props = withDefaults(defineProps<{
  value?: string | number | (string | number)[]
  options?: Option[]
  mode?: 'multiple' | 'tags'
  placeholder?: string
  showSearch?: boolean
  allowClear?: boolean
}>(), {
  options: () => [],
  showSearch: false,
  allowClear: false
})

const emit = defineEmits<{
  'update:value': [value: any]
}>()

const modelValue = computed({
  get: () => props.value,
  set: (val) => emit('update:value', val)
})
</script>
