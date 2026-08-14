<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import ArticleList from '../components/ArticleList.vue'
import { useHomeStore } from '../stores/home'

defineOptions({ name: 'HomeView' })

const homeStore = useHomeStore()
const { articles, articlesCount, error, status } = storeToRefs(homeStore)

function loadGlobalFeed(): void {
  void homeStore.fetchGlobalFeed()
}

onMounted(loadGlobalFeed)
</script>

<template>
  <main class="home-page">
    <section class="banner">
      <div class="container">
        <p class="eyebrow">Vue 3 · TypeScript · Bun</p>
        <h1>conduit</h1>
        <p>A place to share your knowledge.</p>
      </div>
    </section>

    <section class="container page" aria-labelledby="iteration-title">
      <header class="iteration-intro">
        <p class="section-label">Global Feed</p>
        <h2 id="iteration-title">从 API 加载真实文章列表</h2>
        <p>
          本轮只完成 Global Feed，先观察请求、store
          和列表组件如何组成一个完整切片。
        </p>
      </header>

      <div class="feed-layout">
        <section class="feed-card" aria-labelledby="feed-title">
          <nav class="feed-toggle" aria-label="Feed 类型">
            <RouterLink class="nav-link active" :to="{ name: 'home' }">
              Global Feed
            </RouterLink>
          </nav>

          <div class="feed-header">
            <h3 id="feed-title">Latest articles</h3>
            <span v-if="status === 'success'">
              {{ articlesCount }} articles
            </span>
            <span v-else-if="status === 'error'">Load failed</span>
            <span v-else>Waiting for articles</span>
          </div>

          <ArticleList
            :status="status"
            :articles="articles"
            :error="error"
            @retry="loadGlobalFeed"
          />
        </section>

        <aside class="route-guide sidebar">
          <p class="event-label">Iteration 8A</p>
          <strong>当前只请求 GET /articles</strong>
          <p>Popular Tags、分页和 Your Feed 会在后续小步中加入。</p>
          <small>先把加载、空列表和错误状态做稳定，再扩展查询参数。</small>
        </aside>
      </div>
    </section>
  </main>
</template>
