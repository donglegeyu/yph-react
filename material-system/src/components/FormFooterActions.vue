<script setup lang="ts">
interface Props {
  submitLoading?: boolean
  submitText?: string
  cancelText?: string
  showSubmit?: boolean
  showCancel?: boolean
  submitDisabled?: boolean
  cancelDisabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  submitLoading: false,
  submitText: '确定',
  cancelText: '取消',
  showSubmit: true,
  showCancel: true,
  submitDisabled: false,
  cancelDisabled: false,
})

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'cancel'): void
}>()

function handleSubmit() {
  emit('submit')
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <div class="form-footer-actions">
    <a-space>
      <a-button
        v-if="showCancel"
        :disabled="cancelDisabled"
        @click="handleCancel"
      >
        {{ cancelText }}
      </a-button>
      <a-button
        v-if="showSubmit"
        type="primary"
        :loading="submitLoading"
        :disabled="submitDisabled"
        @click="handleSubmit"
      >
        {{ submitText }}
      </a-button>
    </a-space>
  </div>
</template>

<style scoped>
.form-footer-actions {
  position: sticky;
  bottom: 0;
  padding: 12px 16px;
  background: #ffffff;
  border-top: 1px solid var(--color-border-secondary);
  display: flex;
  justify-content: flex-end;
  box-sizing: border-box;
  z-index: 10;
}
</style>
