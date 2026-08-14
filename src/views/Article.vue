<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineOptions({ name: 'ArticleView' })

defineProps<{
  slug: string
}>()
</script>

<template>
  <main class="route-page">
    <section class="route-card">
      <p class="route-kicker">/article/:slug</p>
      <h1>文章详情占位页</h1>
      <p>Router 把动态参数作为 Prop 交给页面组件：</p>
      <code class="route-value">{{ slug }}</code>
      <RouterLink :to="{ name: 'home' }">返回文章列表</RouterLink>
    </section>
  </main>
</template>
