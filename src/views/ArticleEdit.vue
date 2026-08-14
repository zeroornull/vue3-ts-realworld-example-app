<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineOptions({ name: 'ArticleEditView' })
</script>

<template>
  <main class="route-page">
    <section class="route-card">
      <p class="route-kicker">Protected route · /editor</p>
      <h1>文章编辑器占位页</h1>
      <p>本轮先保护编辑入口，文章创建和编辑表单会在后续迭代实现。</p>
      <RouterLink :to="{ name: 'home' }">返回首页</RouterLink>
    </section>
  </main>
</template>
