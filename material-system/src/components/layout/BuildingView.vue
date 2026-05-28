<template>
  <div class="building-view">
    <div class="building-content">
      <svg class="building-icon" viewBox="0 0 1024 1024">
        <use href="#construction" />
      </svg>
      <h2>页面开发中</h2>
      <p>该功能正在开发中，敬请期待...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 页面开发中占位组件
</script>

<style scoped lang="scss">
.building-view {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.building-content {
  text-align: center;
  color: #999;

  .building-icon {
    width: 120px;
    height: 120px;
    margin-bottom: 24px;
    opacity: 0.5;
  }

  h2 {
    font-size: 24px;
    font-weight: 500;
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: #666;
  }
}
</style>
