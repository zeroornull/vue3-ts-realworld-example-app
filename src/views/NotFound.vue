<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="route-page">
    <section class="route-card">
      <p class="route-kicker">404</p>
      <h1>页面不存在</h1>
      <p>当前 URL 没有匹配到已注册的路由。</p>
      <RouterLink :to="{ name: 'home' }">返回首页</RouterLink>
    </section>
  </main>
</template>
