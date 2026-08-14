<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineOptions({ name: 'RegisterView' })
</script>

<template>
  <main class="route-page">
    <section class="route-card">
      <p class="route-kicker">/register</p>
      <h1>注册占位页</h1>
      <p>账号模型、校验和 API 都不属于本轮范围。</p>
      <RouterLink :to="{ name: 'home' }">返回首页</RouterLink>
    </section>
  </main>
</template>
