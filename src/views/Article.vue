<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import ArticleMeta from '../components/ArticleMeta.vue'
import TagList from '../components/TagList.vue'
import { renderMarkdown } from '../services/markdown'
import { useArticleStore } from '../stores/article'
import { useAuthStore } from '../stores/auth'

defineOptions({ name: 'ArticleView' })

const props = defineProps<{
  slug: string
}>()

const articleStore = useArticleStore()
const { article, error, status } = storeToRefs(articleStore)
const { token } = storeToRefs(useAuthStore())

const renderedBody = computed(() => renderMarkdown(article.value?.body ?? ''))

function loadArticle(): void {
  void articleStore.fetchArticle(props.slug, token.value)
}

watch([() => props.slug, token], loadArticle, { immediate: true })
</script>

<template>
  <main class="article-page">
    <section
      v-if="status === 'idle' || status === 'loading'"
      class="article-state"
      aria-live="polite"
    >
      Loading article...
    </section>

    <section v-else-if="status === 'error'" class="article-state" role="alert">
      <h1>Article unavailable</h1>
      <p>{{ error }}</p>
      <div class="state-actions">
        <button type="button" @click="loadArticle">Try again</button>
        <RouterLink :to="{ name: 'home' }">Back to Global Feed</RouterLink>
      </div>
    </section>

    <article v-else-if="article">
      <header class="article-banner">
        <div class="container">
          <p class="section-label">Article detail · Safe Markdown</p>
          <h1>{{ article.title }}</h1>
          <ArticleMeta :article="article" />
        </div>
      </header>

      <div class="container article-content">
        <!-- This is the only v-html boundary; renderedBody is DOMPurify output. -->
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="markdown-body" v-html="renderedBody"></div>
        <TagList v-if="article.tagList.length" :tags="article.tagList" />
        <hr />
        <ArticleMeta :article="article" />
      </div>
    </article>

    <section v-else class="article-state" role="alert">
      <h1>Article unavailable</h1>
      <p>The article response was empty.</p>
    </section>
  </main>
</template>

<style scoped>
.article-page {
  flex: 1;
}

.article-banner {
  padding-block: 3.25rem;
  color: #ffffff;
  background: #292d32;
}

.article-banner .section-label {
  color: #9ed99e;
}

.article-banner h1 {
  max-width: 52rem;
  margin: 0 0 1.5rem;
  font-size: clamp(2.25rem, 6vw, 3.8rem);
  line-height: 1.08;
  letter-spacing: -0.035em;
}

.article-banner :deep(.article-meta) {
  max-width: 28rem;
  margin: 0;
}

.article-banner :deep(.author),
.article-banner :deep(.favorite-count) {
  color: #9ed99e;
}

.article-banner :deep(.article-date) {
  color: #c8cdd2;
}

.article-content {
  padding-block: 3rem 4rem;
}

.markdown-body {
  color: var(--ink);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.1rem;
  line-height: 1.85;
  overflow-wrap: anywhere;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  line-height: 1.25;
}

.markdown-body :deep(a) {
  color: var(--conduit-green-dark);
}

.markdown-body :deep(pre) {
  padding: 1rem;
  overflow-x: auto;
  border-radius: 0.5rem;
  background: #f0f2f3;
}

.article-content > :deep(.tag-list) {
  margin-top: 2rem;
}

.article-content hr {
  margin-block: 2.5rem;
  border: 0;
  border-top: 1px solid var(--line);
}

.article-state {
  display: grid;
  width: min(100% - 2rem, 48rem);
  min-height: calc(100vh - 8rem);
  margin-inline: auto;
  place-content: center;
  gap: 1rem;
  color: var(--muted);
  text-align: center;
}

.article-state h1,
.article-state p {
  margin: 0;
}

.article-state h1 {
  color: var(--ink);
}

.state-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
}

.state-actions button,
.state-actions a {
  padding: 0.55rem 0.8rem;
  border: 1px solid var(--conduit-green-dark);
  border-radius: 0.35rem;
  color: var(--conduit-green-dark);
  background: transparent;
  text-decoration: none;
  cursor: pointer;
}
</style>
