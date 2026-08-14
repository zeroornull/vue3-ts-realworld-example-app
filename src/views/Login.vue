<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineOptions({ name: 'LoginView' })
</script>

<template>
  <main class="route-page">
    <section class="route-card">
      <p class="route-kicker">/login</p>
      <h1>登录占位页</h1>
      <p>这一迭代只建立页面和 URL 的关系，表单与认证稍后再迁移。</p>
      <RouterLink :to="{ name: 'home' }">返回首页</RouterLink>
    </section>
  </main>
</template>
