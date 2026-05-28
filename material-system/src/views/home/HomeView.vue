<template>
  <div class="home-view">
    <h1>欢迎使用星际造梦</h1>
    <div class="stats-grid">
      <a-card v-for="stat in stats" :key="stat.title" :title="stat.title">
        <template #extra>
          <svg class="stat-icon">
            <use :href="`#${stat.icon}`" />
          </svg>
        </template>
        <div class="stat-value">{{ stat.value }}</div>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
const stats = [
  { title: '材料申请', value: '0', icon: 'file' },
  { title: '采购订单', value: '0', icon: 'buy' },
  { title: '待审核', value: '0', icon: 'check-circle' },
  { title: '已完成', value: '0', icon: 'check-circle' },
]
</script>

<style scoped lang="scss">
.home-view {
  padding: 24px;

  h1 {
    margin-bottom: 24px;
    font-size: 24px;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: var(--ant-color-primary, #F95914);
}

.stat-icon {
  width: 32px;
  height: 32px;
  color: var(--color-text-disabled-light, #999);
}
</style>
