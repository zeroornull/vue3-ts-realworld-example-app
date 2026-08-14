<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ArticlePreview from '../components/ArticlePreview.vue'

defineOptions({ name: 'HomeView' })

const previewArticles = [
  {
    slug: 'learn-vue-props',
    title: '把数据通过 Props 传给子组件',
    description: '父组件保留数据来源，子组件只负责按照明确的类型契约展示文章。',
    author: 'Conduit Learner',
  },
  {
    slug: 'learn-vue-emits',
    title: '用 Emits 把用户操作通知父组件',
  },
]

const route = useRoute()
const router = useRouter()

const currentPage = computed(() =>
  typeof route.query.page === 'string' ? route.query.page : '1',
)

function openArticle(slug: string): void {
  void router.push({ name: 'article', params: { slug } })
}
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
        <p class="section-label">Vue Router 导航骨架</p>
        <h2 id="iteration-title">让 URL 和页面职责先成立</h2>
        <p>文章仍是本地 fixture；点击预览后只根据 slug 导航到占位详情页。</p>
      </header>

      <div class="feed-layout">
        <section class="feed-card" aria-labelledby="feed-title">
          <div class="feed-header">
            <h3 id="feed-title">Global Feed 预览</h3>
            <span>{{ previewArticles.length }} 个本地 fixture</span>
          </div>

          <ArticlePreview
            v-for="article in previewArticles"
            :key="article.slug"
            :article="article"
            @select="openArticle"
          />
        </section>

        <aside class="route-guide">
          <p class="event-label">Route query</p>
          <strong>当前页码：{{ currentPage }}</strong>
          <RouterLink :to="{ name: 'home', query: { page: '2' } }"
            >切换到 ?page=2</RouterLink
          >
          <RouterLink :to="{ name: 'profile', params: { username: 'alice' } }">
            打开 /profile/alice
          </RouterLink>
          <small>RouterLink 切换 URL 时不会整页刷新。</small>
        </aside>
      </div>
    </section>
  </main>
</template>
