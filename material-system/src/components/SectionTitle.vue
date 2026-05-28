<template>
  <div class="section-title">
    <span>{{ title }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
}

defineProps<Props>()
</script>

<style scoped lang="scss">
.section-title {
  text-align: left;
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 16px;
  padding-left: 13px;
  height: 16px;
  line-height: 16px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 5px;
    height: 13px;
    background: var(--primary-color);
    border-radius: 2px;
  }
}
</style>
