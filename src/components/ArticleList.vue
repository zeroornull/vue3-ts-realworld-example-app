<script setup lang="ts">
import type { HomeStatus } from '../stores/home'
import type { ArticleSummary } from '../types/realworld'
import ArticlePreview from './ArticlePreview.vue'

defineProps<{
  status: HomeStatus
  articles: ArticleSummary[]
  error: string | null
}>()

defineEmits<{
  retry: []
}>()
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
    No articles are here... yet.
  </div>

  <template v-else>
    <ArticlePreview
      v-for="article in articles"
      :key="article.slug"
      :article="article"
    />
  </template>
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
