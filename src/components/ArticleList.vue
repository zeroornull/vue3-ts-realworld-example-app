<script setup lang="ts">
import { computed } from 'vue'
import { ARTICLES_PER_PAGE, createPaginationPages } from '../router/feed-query'
import type { HomeStatus } from '../stores/home'
import type { ArticleSummary } from '../types/realworld'
import ArticlePreview from './ArticlePreview.vue'
import VPagination from './VPagination.vue'

const props = defineProps<{
  status: HomeStatus
  articles: ArticleSummary[]
  articlesCount: number
  currentPage: number
  error: string | null
  emptyMessage?: string
}>()

defineEmits<{
  retry: []
  'update:currentPage': [page: number]
}>()

const pages = computed(() =>
  createPaginationPages(props.articlesCount, ARTICLES_PER_PAGE),
)
</script>

<template>
  <div
    v-if="status === 'idle' || status === 'loading'"
    class="article-preview feed-message"
    aria-live="polite"
  >
    Loading articles...
  </div>

  <div
    v-else-if="status === 'error'"
    class="article-preview feed-message feed-error"
    role="alert"
  >
    <span>{{ error }}</span>
    <button type="button" @click="$emit('retry')">Try again</button>
  </div>

  <div
    v-else-if="articles.length === 0"
    class="article-preview feed-message empty-feed-message"
  >
    {{ emptyMessage ?? 'No articles are here... yet.' }}
  </div>

  <template v-else>
    <ArticlePreview
      v-for="article in articles"
      :key="article.slug"
      :article="article"
    />
  </template>

  <VPagination
    v-if="status === 'success'"
    :pages="pages"
    :current-page="currentPage"
    @update:current-page="$emit('update:currentPage', $event)"
  />
</template>

<style scoped>
.feed-message {
  padding: 1.5rem;
  border-top: 1px solid var(--line);
  color: var(--muted);
  line-height: 1.6;
}

.feed-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: #b42318;
}

.feed-error button {
  padding: 0.45rem 0.7rem;
  border: 1px solid #b42318;
  border-radius: 0.35rem;
  color: #b42318;
  background: transparent;
  cursor: pointer;
}
</style>
