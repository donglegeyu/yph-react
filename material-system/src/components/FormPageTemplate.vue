<script setup lang="ts">
import { ref } from 'vue'
import PageTitle from './PageTitle.vue'

interface Props {
  title: string
  showBack?: boolean
  backPath?: string
  loading?: boolean
  submitLoading?: boolean
  showFooter?: boolean
  footerPosition?: 'fixed' | 'static'
}

const props = withDefaults(defineProps<Props>(), {
  showBack: false,
  backPath: '',
  loading: false,
  submitLoading: false,
  showFooter: true,
  footerPosition: 'fixed',
})

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'cancel'): void
}>()

const isScrolling = ref(false)
let scrollTimeout: number | null = null

function handleScroll(e: Event) {
  const target = e.target as HTMLElement
  isScrolling.value = true

  if (scrollTimeout !== null) {
    clearTimeout(scrollTimeout)
  }

  scrollTimeout = window.setTimeout(() => {
    isScrolling.value = false
  }, 150)

  const scrollTop = target.scrollTop
  target.classList.toggle('scrolled', scrollTop > 0)
}

function handleSubmit() {
  emit('submit')
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <div class="form-page-template">
    <PageTitle
      :title="title"
      :showBack="showBack"
      :backPath="backPath"
      class="form-page-title"
    >
      <template v-if="$slots.titleActions" #actions>
        <slot name="titleActions" />
      </template>
    </PageTitle>

    <div class="form-page-container">
      <div
        class="form-page-content"
        :class="{ scrolling: isScrolling }"
        @scroll="handleScroll"
      >
        <a-card class="form-page-card">
          <slot />
        </a-card>

        <div v-if="showFooter && footerPosition === 'static'" class="form-page-footer static">
          <a-space>
            <a-button @click="handleCancel">取消</a-button>
            <a-button type="primary" :loading="submitLoading" @click="handleSubmit">
              确定
            </a-button>
          </a-space>
        </div>
      </div>

      <div v-if="showFooter && footerPosition === 'fixed'" class="form-page-footer fixed">
        <a-space>
          <a-button @click="handleCancel">取消</a-button>
          <a-button type="primary" :loading="submitLoading" @click="handleSubmit">
            确定
          </a-button>
        </a-space>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-page-template {
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0rem 0.75rem;
  flex-grow: 1;
  align-self: stretch;
  z-index: 1;
  overflow: hidden;
}

.form-page-title {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--color-bg-page);

  :deep(.page-title) {
    padding: 0 4px;
  }
}

.form-page-container {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  align-self: stretch;
  z-index: 3;
  border-radius: 0.38rem 0.38rem 0rem 0rem;
  background: #FFFFFF;
  overflow: hidden;
}

.form-page-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  padding: 0;
}

.form-page-content::-webkit-scrollbar {
  width: 6px;
}

.form-page-content::-webkit-scrollbar-track {
  background: transparent;
}

.form-page-content::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 3px;
}

.form-page-content:hover::-webkit-scrollbar-thumb,
.form-page-content:active::-webkit-scrollbar-thumb,
.form-page-content:focus::-webkit-scrollbar-thumb,
.form-page-content.scrolling::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
}

.form-page-card {
  margin-bottom: 16px;
  border: none;
  box-shadow: none;

  :deep(.ant-card-body) {
    padding: 16px;
  }
}

.form-page-footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  background: #ffffff;
  border-top: 1px solid var(--color-border-secondary);
  box-sizing: border-box;

  &.fixed {
    position: sticky;
    bottom: 0;
    z-index: 10;
  }

  &.static {
    position: relative;
  }
}
</style>
