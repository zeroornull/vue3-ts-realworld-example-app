<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineOptions({ name: 'ProfileView' })

defineProps<{
  username: string
}>()
</script>

<template>
  <main class="route-page">
    <section class="route-card">
      <p class="route-kicker">/profile/:username</p>
      <h1>用户主页占位页</h1>
      <p>当前 URL 中的用户名：</p>
      <code class="route-value">{{ username }}</code>
      <RouterLink :to="{ name: 'home' }">返回首页</RouterLink>
    </section>
  </main>
</template>
