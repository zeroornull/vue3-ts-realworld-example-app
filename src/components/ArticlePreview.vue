<script setup lang="ts">
type PreviewArticle = {
  slug: string
  title: string
  description?: string
  author?: string
}

const props = withDefaults(
  defineProps<{
    article: PreviewArticle
    actionLabel?: string
  }>(),
  {
    actionLabel: 'Read more...',
  },
)

const emit = defineEmits<{
  select: [slug: PreviewArticle['slug']]
}>()

function selectArticle(): void {
  emit('select', props.article.slug)
}
</script>

<template>
  <article class="article-preview">
    <div class="article-meta">
      <span class="author">{{ article.author || '匿名作者' }}</span>
      <span class="fixture-label">Local fixture</span>
    </div>

    <h3>{{ article.title }}</h3>
    <p>{{ article.description || '这篇文章暂时没有摘要。' }}</p>

    <button
      class="preview-link"
      type="button"
      :aria-label="`${actionLabel}：${article.title}`"
      @click="selectArticle"
    >
      {{ actionLabel }}
    </button>
  </article>
</template>

<style scoped>
.article-preview {
  padding: 1.5rem;
  border-top: 1px solid var(--line);
}

.article-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.author {
  color: var(--conduit-green-dark);
  font-size: 0.9rem;
  font-weight: 700;
}

.fixture-label {
  color: var(--muted);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h3 {
  margin: 0;
  color: var(--ink);
  font-size: 1.35rem;
  line-height: 1.3;
}

p {
  margin: 0.55rem 0 1rem;
  color: var(--muted);
  line-height: 1.65;
}

.preview-link {
  padding: 0;
  border: 0;
  color: #8a8f94;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
}

.preview-link:hover {
  color: var(--conduit-green-dark);
  text-decoration: underline;
}
</style>
