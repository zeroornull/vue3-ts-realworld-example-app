<script setup lang="ts">
import type { ArticleSummary } from '../types/realworld'
import { RouterLink } from 'vue-router'
import ArticleMeta from './ArticleMeta.vue'
import TagList from './TagList.vue'

defineProps<{
  article: ArticleSummary
}>()
</script>

<template>
  <article class="article-preview">
    <ArticleMeta :article="article" />

    <RouterLink
      class="preview-link"
      :to="{ name: 'article', params: { slug: article.slug } }"
    >
      <h2>{{ article.title }}</h2>
      <p>{{ article.description }}</p>

      <div class="preview-footer">
        <span>Read more...</span>
        <TagList v-if="article.tagList.length" :tags="article.tagList" />
      </div>
    </RouterLink>
  </article>
</template>

<style scoped>
.article-preview {
  padding: 1.5rem;
  border-top: 1px solid var(--line);
}

.preview-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.preview-link {
  display: grid;
  gap: 0.5rem;
  color: inherit;
  text-decoration: none;
}

h2,
p {
  margin: 0;
}

h2 {
  color: var(--ink);
  font-size: 1.35rem;
  line-height: 1.3;
}

p {
  color: var(--muted);
  line-height: 1.65;
}

.preview-footer {
  margin-top: 0.5rem;
  color: #8a8f94;
  font-size: 0.85rem;
}

.preview-link:hover h2 {
  color: var(--conduit-green-dark);
}

@media (max-width: 32rem) {
  .preview-footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
