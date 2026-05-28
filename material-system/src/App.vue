<template>
  <a-config-provider
    :theme="{
      token: {
        colorPrimary: '#F95914',
      },
      components: {
        Radio: {
          colorPrimary: '#F95914',
        },
      },
    }"
  >
    <router-view />
  </a-config-provider>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(async () => {
  try {
    const res = await fetch('/iconpark/sprite_nav.svg')
    if (res.ok) {
      const svgText = await res.text()
      const div = document.createElement('div')
      div.innerHTML = svgText
      div.style.display = 'none'
      document.body.appendChild(div)
    }
  } catch (e) {
    console.error('加载图标失败:', e)
  }
})
</script>
