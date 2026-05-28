<template>
  <div class="page-title">
    <div class="left">
      <template v-if="showBack">
        <a-button type="text" class="back-btn" @click="handleBack">
          <template v-if="$slots.backIcon">
            <slot name="backIcon"></slot>
          </template>
          <template v-else>
            <svg viewBox="0 0 1024 1024" style="width:14px;height:14px"><path d="M609.344 226.906667L318.250667 512l291.093333 285.094667a42.666667 42.666667 0 0 1-60.330666 60.330666l-315.733334-309.12a42.666667 42.666667 0 0 1 0-60.330666l315.392-308.373333a42.666667 42.666667 0 0 1 60.672 24.32 42.666667 42.666667 0 0 1-0.341334 36.181333z" fill="currentColor"/></svg>
          </template>
          <template v-if="showBackText">
            <span>{{ backText }}</span>
          </template>
        </a-button>
        <span v-if="showDivider" class="divider"></span>
      </template>
      <span class="title">{{ title }}</span>
      <template v-if="$slots.titleSuffix">
        <span class="title-suffix">
          <slot name="titleSuffix"></slot>
        </span>
      </template>
    </div>
    <div v-if="$slots.actions" class="actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

interface Props {
  title: string
  showBack?: boolean
  showBackText?: boolean
  showDivider?: boolean
  backText?: string
  backPath?: string
}

const props = withDefaults(defineProps<Props>(), {
  showBack: false,
  showBackText: true,
  showDivider: true,
  backText: '返回',
  backPath: ''
})

const router = useRouter()

function handleBack() {
  if (props.backPath) {
    router.push(props.backPath)
  } else {
    router.back()
  }
}
</script>

<style scoped lang="scss">
.page-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0;
  background: transparent;

  .left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 4px;
    color: var(--color-text-secondary, rgba(0, 0, 0, 0.65));
    font-size: 14px;

    &:hover {
      color: var(--primary-color);
    }
  }

  .divider {
    width: 1px;
    height: 16px;
    background: var(--color-border, #d9d9d9);
    margin: 0 4px;
  }

  .title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text, rgba(0, 0, 0, 0.88));
  }

  .title-suffix {
    margin-left: 8px;
    font-size: 14px;
    color: var(--color-text-secondary, rgba(0, 0, 0, 0.65));
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>
