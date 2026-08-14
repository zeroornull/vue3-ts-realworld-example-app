<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import ArticleActions from '../components/ArticleActions.vue'
import ArticleMeta from '../components/ArticleMeta.vue'
import ArticleComment from '../components/Comment.vue'
import CommentEditor from '../components/CommentEditor.vue'
import TagList from '../components/TagList.vue'
import { renderMarkdown } from '../services/markdown'
import { useArticleStore } from '../stores/article'
import { useAuthStore } from '../stores/auth'

defineOptions({ name: 'ArticleView' })

const props = defineProps<{
  slug: string
}>()

const route = useRoute()
const articleStore = useArticleStore()
const { article, comments, commentsError, commentsStatus, error, status } =
  storeToRefs(articleStore)
const { isAuthenticated, token } = storeToRefs(useAuthStore())

const renderedBody = computed(() => renderMarkdown(article.value?.body ?? ''))

function loadArticle(): void {
  void articleStore.fetchArticle(props.slug, token.value)
  void articleStore.fetchComments(props.slug, token.value)
}

function loadComments(): void {
  void articleStore.fetchComments(props.slug, token.value)
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
          <div class="article-header-actions">
            <ArticleMeta :article="article" :show-favorites="false" />
            <ArticleActions :article="article" />
          </div>
        </div>
      </header>

      <div class="container article-content">
        <!-- This is the only v-html boundary; renderedBody is DOMPurify output. -->
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="markdown-body" v-html="renderedBody"></div>
        <TagList v-if="article.tagList.length" :tags="article.tagList" />
        <hr />
        <div class="article-footer-actions">
          <ArticleMeta :article="article" :show-favorites="false" />
          <ArticleActions :article="article" />
        </div>

        <section class="comments-section" aria-labelledby="comments-title">
          <h2 id="comments-title">Comments</h2>

          <CommentEditor v-if="isAuthenticated" :slug="slug" />
          <p v-else class="comment-auth-prompt">
            <RouterLink
              :to="{
                name: 'login',
                query: { redirect: route.fullPath },
              }"
            >
              Sign in
            </RouterLink>
            or
            <RouterLink
              :to="{
                name: 'register',
                query: { redirect: route.fullPath },
              }"
            >
              sign up
            </RouterLink>
            to add comments on this article.
          </p>

          <p
            v-if="commentsStatus === 'idle' || commentsStatus === 'loading'"
            class="comments-message"
            aria-live="polite"
          >
            Loading comments...
          </p>

          <div
            v-else-if="commentsStatus === 'error'"
            class="comments-message comments-error"
            role="alert"
          >
            <span>{{ commentsError }}</span>
            <button type="button" @click="loadComments">Try again</button>
          </div>

          <p v-else-if="comments.length === 0" class="comments-message">
            No comments yet.
          </p>

          <div v-else class="comment-list">
            <ArticleComment
              v-for="comment in comments"
              :key="comment.id"
              :slug="slug"
              :comment="comment"
            />
          </div>
        </section>
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

.article-header-actions,
.article-footer-actions {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1.5rem;
}

.article-header-actions :deep(.article-meta),
.article-footer-actions :deep(.article-meta) {
  flex: 1;
}

.article-banner :deep(.favorite-button) {
  border-color: #9ed99e;
  color: #9ed99e;
}

.article-banner :deep(.favorite-button.active) {
  color: #1f2428;
  background: #9ed99e;
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

.comments-section {
  display: grid;
  width: min(100%, 48rem);
  gap: 1rem;
  margin: 3rem auto 0;
}

.comments-section h2 {
  margin: 0;
  color: var(--ink);
}

.comment-auth-prompt,
.comments-message {
  margin: 0;
  color: var(--muted);
  line-height: 1.65;
}

.comment-auth-prompt a {
  color: var(--conduit-green-dark);
  font-weight: 700;
}

.comment-list {
  display: grid;
  gap: 1rem;
}

.comments-section :deep(.card) {
  border: 1px solid var(--line);
  border-radius: 0.5rem;
  background: var(--surface);
  box-shadow: 0 0.75rem 2rem rgb(39 43 48 / 6%);
}

.comments-section :deep(.card-block) {
  padding: 1rem;
}

.comments-section :deep(.card-footer) {
  display: flex;
  min-height: 3.25rem;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 1rem;
  border-top: 1px solid var(--line);
  background: #f7f8f8;
}

.comments-section :deep(.comment-author-img) {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  object-fit: cover;
}

.comments-section :deep(.error-messages) {
  padding: 0.75rem 1rem;
}

.comments-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.comments-error button {
  padding: 0.45rem 0.7rem;
  border: 1px solid #b42318;
  border-radius: 0.35rem;
  color: #b42318;
  background: transparent;
  cursor: pointer;
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

@media (max-width: 40rem) {
  .article-header-actions,
  .article-footer-actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
