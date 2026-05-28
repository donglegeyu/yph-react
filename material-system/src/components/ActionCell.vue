<template>
  <a-space :size="4">
    <template v-for="btn in visibleButtons" :key="btn.key">
      <a-popconfirm v-if="btn.confirm" :title="btn.confirmTitle" @confirm="handleClick(btn)">
        <a-button type="link" :danger="btn.danger">
          {{ btn.label }}
        </a-button>
      </a-popconfirm>
      <a-button v-else type="link" :danger="btn.danger" @click="handleClick(btn)">
        {{ btn.label }}
      </a-button>
    </template>
    <a-dropdown v-if="moreButtons.length > 0" placement="bottomRight">
      <a-button type="link" class="more-btn">
        <template #icon>
          <svg viewBox="0 0 48 48" style="width:16px;height:16px">
            <use href="#more-one-klbc4h5f" />
          </svg>
        </template>
      </a-button>
      <template #overlay>
        <a-menu @click="(info: { key: string | number }) => handleMenuClick(info)">
          <a-menu-item v-for="btn in moreButtons" :key="btn.key">
            <a-popconfirm v-if="btn.confirm" :title="btn.confirmTitle" @confirm="handleClick(btn)">
              <span>{{ btn.label }}</span>
            </a-popconfirm>
            <span v-else>{{ btn.label }}</span>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </a-space>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface ActionButton {
  key: string
  label: string
  danger?: boolean
  confirm?: boolean
  confirmTitle?: string
  onClick?: () => void
}

const props = defineProps<{
  buttons: ActionButton[]
  maxVisible?: number
}>()

const emit = defineEmits<{
  click: [key: string]
}>()

const maxVisible = computed(() => props.maxVisible ?? 2)

const visibleButtons = computed(() => props.buttons.slice(0, maxVisible.value))
const moreButtons = computed(() => props.buttons.slice(maxVisible.value))

function handleClick(btn: ActionButton) {
  if (btn.onClick) {
    btn.onClick()
  } else {
    emit('click', btn.key)
  }
}

function handleMenuClick(info: { key: string | number }) {
  const key = String(info.key)
  const btn = props.buttons.find(b => b.key === key)
  if (btn?.onClick) {
    btn.onClick()
  } else {
    emit('click', key)
  }
}
</script>

<style scoped>
.more-btn {
  color: #F95914 !important;
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  height: auto !important;
  line-height: 1 !important;
}

.more-btn:hover,
.more-btn:focus,
.more-btn:active {
  color: #F95914 !important;
  background: transparent !important;
  border: none !important;
}

:deep(.ant-dropdown-trigger) {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
}

:deep(.ant-btn-link) {
  color: #F95914 !important;
  background: transparent !important;
  border: none !important;
}

:deep(.ant-btn-link:hover),
:deep(.ant-btn-link:focus) {
  color: #E04D10 !important;
  background: transparent !important;
  border: none !important;
}
</style>
