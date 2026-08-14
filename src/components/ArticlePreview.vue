<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { ArticleSummary } from '../types/realworld'
import TagList from './TagList.vue'

defineProps<{
  article: ArticleSummary
}>()

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
}
</script>

<template>
  <article class="article-preview">
    <div class="article-meta">
      <div class="author-details">
        <RouterLink
          class="author"
          :to="{
            name: 'profile',
            params: { username: article.author.username },
          }"
        >
          {{ article.author.username }}
        </RouterLink>
        <time class="article-date" :datetime="article.createdAt">
          {{ formatDate(article.createdAt) }}
        </time>
      </div>

      <span
        class="favorite-count"
        :aria-label="`${article.favoritesCount} favorites`"
      >
        ♥ {{ article.favoritesCount }}
      </span>
    </div>

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

.article-meta,
.preview-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.article-meta {
  margin-bottom: 0.8rem;
}

.author-details {
  display: grid;
  gap: 0.15rem;
}

.author {
  color: var(--conduit-green-dark);
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
}

.author:hover {
  text-decoration: underline;
}

.article-date,
.favorite-count {
  color: var(--muted);
  font-size: 0.75rem;
}

.favorite-count {
  padding: 0.3rem 0.55rem;
  border: 1px solid rgb(92 184 92 / 40%);
  border-radius: 0.35rem;
  color: var(--conduit-green-dark);
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
