<script setup lang="ts">
import { computed, ref } from 'vue'
import ArticlePreview from './components/ArticlePreview.vue'

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

const selectedArticleSlug = ref<string | null>(null)

const selectedArticle = computed(() =>
  previewArticles.find((article) => article.slug === selectedArticleSlug.value),
)

function handleArticleSelect(slug: string): void {
  selectedArticleSlug.value = slug
}
</script>

<template>
  <div class="app-shell">
    <header class="navbar">
      <div class="container navbar-content">
        <a class="navbar-brand" href="/">conduit</a>
        <span class="iteration-label">Iteration 2</span>
      </div>
    </header>

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
          <p class="section-label">类型化组件契约</p>
          <h2 id="iteration-title">Props 向下传文章，Emits 向上传事件</h2>
          <p>
            文章仍然来自 App.vue 中的本地
            fixture；这一轮只练习父子组件通信，不加入 Router、Pinia 或 API。
          </p>
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
              @select="handleArticleSelect"
            />
          </section>

          <aside class="event-panel" aria-live="polite">
            <p class="event-label">父组件收到的 select 事件</p>
            <template v-if="selectedArticle">
              <strong>{{ selectedArticle.title }}</strong>
              <code>{{ selectedArticle.slug }}</code>
            </template>
            <p v-else>
              点击任意文章的“Read more...”，这里会显示子组件发出的 slug。
            </p>
            <small>子组件不会直接修改父组件状态，只负责调用 emit。</small>
          </aside>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="container">
        Iteration 2 · Typed props, typed emits, local fixtures.
      </div>
    </footer>
  </div>
</template>
