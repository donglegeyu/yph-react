<script setup lang="ts">
import { ref } from 'vue'
import PageTitle from './PageTitle.vue'
import FormFooterActions from './FormFooterActions.vue'

interface Props {
  title: string
  showBack?: boolean
  backPath?: string
  loading?: boolean
  submitLoading?: boolean
  submitText?: string
  cancelText?: string
}

const props = withDefaults(defineProps<Props>(), {
  showBack: true,
  backPath: '',
  loading: false,
  submitLoading: false,
  submitText: '确定',
  cancelText: '取消',
})

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'cancel'): void
}>()

const isScrolling = ref(false)
let scrollTimer: ReturnType<typeof setTimeout> | null = null

function handleScroll() {
  isScrolling.value = true
  if (scrollTimer) {
    clearTimeout(scrollTimer)
  }
  scrollTimer = setTimeout(() => {
    isScrolling.value = false
  }, 500)
}

function handleSubmit() {
  emit('submit')
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <div class="domain-edit-page">
    <PageTitle
      :title="title"
      :showBack="showBack"
      :backPath="backPath"
      class="domain-edit-page-title"
    >
      <template v-if="$slots.titleActions" #actions>
        <slot name="titleActions" />
      </template>
    </PageTitle>

    <div class="domain-edit-wrapper">
      <div
        class="domain-edit-container"
        :class="{ scrolling: isScrolling }"
        @scroll="handleScroll"
      >
        <a-card class="domain-edit-card">
          <a-spin :spinning="loading">
            <slot />
          </a-spin>
        </a-card>
      </div>

      <FormFooterActions
        :submitLoading="submitLoading"
        :submitText="submitText"
        :cancelText="cancelText"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.domain-edit-page {
  padding: 0 12px;
  height: 100%;
  overflow: hidden;
}

.domain-edit-page-title {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--color-bg-page);

  :deep(.page-title) {
    padding: 0 4px;
  }
}

.domain-edit-wrapper {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 88px);
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  background: var(--color-bg-container);
  border-radius: 8px 8px 0 0;
}

.domain-edit-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.domain-edit-container::-webkit-scrollbar {
  width: 6px;
}

.domain-edit-container::-webkit-scrollbar-track {
  background: transparent;
}

.domain-edit-container::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 3px;
}

.domain-edit-container:hover::-webkit-scrollbar-thumb,
.domain-edit-container:active::-webkit-scrollbar-thumb,
.domain-edit-container:focus::-webkit-scrollbar-thumb,
.domain-edit-container.scrolling::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
}

.domain-edit-container.scrolling {
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.domain-edit-card {
  padding: 0;
  border-radius: 8px 8px 0 0;

  :deep(.ant-card-body) {
    padding: 16px;
  }
}
</style>
