<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { ArticleSummary } from '../types/realworld'

withDefaults(
  defineProps<{
    article: ArticleSummary
    showFavorites?: boolean
  }>(),
  {
    showFavorites: true,
  },
)

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
      v-if="showFavorites"
      class="favorite-count"
      :aria-label="`${article.favoritesCount} favorites`"
    >
      ♥ {{ article.favoritesCount }}
    </span>
  </div>
</template>

<style scoped>
.article-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
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
</style>
