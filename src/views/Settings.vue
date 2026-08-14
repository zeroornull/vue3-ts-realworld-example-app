<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineOptions({ name: 'SettingsView' })
</script>

<template>
  <main class="route-page">
    <section class="route-card">
      <p class="route-kicker">Protected route · /settings</p>
      <h1>Settings 占位页</h1>
      <p>本轮只验证会话恢复和路由保护，设置表单会在后续迭代实现。</p>
      <RouterLink :to="{ name: 'home' }">返回首页</RouterLink>
    </section>
  </main>
</template>
