<template>
  <div class="main-layout">
    <FirstSidebar />
    <SecondSidebar />
    <div class="main-content">
      <TabBar />
      <router-view :key="$route.fullPath" />
    </div>
  </div>
</template>

<script setup lang="ts">
import FirstSidebar from './FirstSidebar.vue'
import SecondSidebar from './SecondSidebar.vue'
import TabBar from './TabBar.vue'
</script>

<style scoped lang="scss">
.main-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  background: #F5F5F5;
  overflow: hidden;
}

.main-content {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #F5F5F5;
  min-width: 0; /* 防止 flex 子元素溢出 */
  z-index: 1;
}

router-view {
  flex: 1;
  overflow: auto;
}
</style>
