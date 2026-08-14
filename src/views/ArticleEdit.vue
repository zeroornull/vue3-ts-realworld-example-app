<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ListErrors from '../components/ListErrors.vue'
import { toApiErrors } from '../services/errors'
import { useArticleStore } from '../stores/article'
import { useAuthStore } from '../stores/auth'
import type { ApiErrors, Article, ArticleDraft } from '../types/realworld'

defineOptions({ name: 'ArticleEditView' })

const props = defineProps<{
  slug?: string
}>()

const router = useRouter()
const articleStore = useArticleStore()
const { token } = storeToRefs(useAuthStore())
const draft = reactive<ArticleDraft>(createEmptyDraft())
const tagInput = ref('')
const errors = ref<ApiErrors>({})
const isLoadingArticle = ref(false)
const isSubmitting = ref(false)
let loadRequestId = 0

function createEmptyDraft(): ArticleDraft {
  return {
    title: '',
    description: '',
    body: '',
    tagList: [],
  }
}

function replaceDraft(nextDraft: ArticleDraft): void {
  draft.title = nextDraft.title
  draft.description = nextDraft.description
  draft.body = nextDraft.body
  draft.tagList = [...nextDraft.tagList]
}

function draftFromArticle(article: Article): ArticleDraft {
  return {
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: [...article.tagList],
  }
}

async function loadDraft(): Promise<void> {
  const requestId = ++loadRequestId
  errors.value = {}
  tagInput.value = ''

  if (!props.slug) {
    replaceDraft(createEmptyDraft())
    isLoadingArticle.value = false
    return
  }

  isLoadingArticle.value = true
  await articleStore.fetchArticle(props.slug, token.value)

  if (requestId !== loadRequestId) {
    return
  }

  if (articleStore.article) {
    replaceDraft(draftFromArticle(articleStore.article))
  } else {
    replaceDraft(createEmptyDraft())
    errors.value = {
      article: [articleStore.error ?? 'could not be loaded'],
    }
  }

  isLoadingArticle.value = false
}

function addTag(): void {
  const nextTags = tagInput.value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

  for (const tag of nextTags) {
    if (!draft.tagList.includes(tag)) {
      draft.tagList.push(tag)
    }
  }

  tagInput.value = ''
}

function removeTag(tag: string): void {
  draft.tagList = draft.tagList.filter((current) => current !== tag)
}

async function submitArticle(): Promise<void> {
  if (isSubmitting.value) {
    return
  }

  addTag()
  isSubmitting.value = true
  errors.value = {}

  try {
    const payload: ArticleDraft = {
      title: draft.title,
      description: draft.description,
      body: draft.body,
      tagList: [...draft.tagList],
    }
    const savedArticle = props.slug
      ? await articleStore.editArticle(props.slug, payload, token.value)
      : await articleStore.publishArticle(payload, token.value)

    await router.push({
      name: 'article',
      params: { slug: savedArticle.slug },
    })
  } catch (error: unknown) {
    errors.value = toApiErrors(error)
  } finally {
    isSubmitting.value = false
  }
}

watch([() => props.slug, token], () => void loadDraft(), { immediate: true })
</script>

<template>
  <main class="editor-page">
    <div class="container editor-container">
      <p class="section-label">
        {{ slug ? 'Edit article' : 'New article' }} · Typed draft
      </p>
      <h1>{{ slug ? 'Edit your article' : 'Write a new article' }}</h1>

      <p v-if="isLoadingArticle" class="editor-message" aria-live="polite">
        Loading article...
      </p>

      <form v-else class="editor-form" @submit.prevent="submitArticle">
        <ListErrors :errors="errors" />

        <fieldset :disabled="isSubmitting">
          <label>
            <span>Title</span>
            <input
              v-model="draft.title"
              name="title"
              type="text"
              placeholder="Article Title"
              required
            />
          </label>

          <label>
            <span>Description</span>
            <input
              v-model="draft.description"
              name="description"
              type="text"
              placeholder="What's this article about?"
              required
            />
          </label>

          <label>
            <span>Body</span>
            <textarea
              v-model="draft.body"
              name="body"
              rows="12"
              placeholder="Write your article (in markdown)"
              required
            ></textarea>
          </label>

          <label>
            <span>Tags</span>
            <input
              v-model="tagInput"
              type="text"
              placeholder="Enter tags"
              @keydown.enter.prevent="addTag"
            />
          </label>

          <ul
            v-if="draft.tagList.length"
            class="tag-list"
            aria-label="Article tags"
          >
            <li v-for="tag in draft.tagList" :key="tag">
              <button
                type="button"
                :aria-label="`Remove ${tag}`"
                @click="removeTag(tag)"
              >
                ×
              </button>
              {{ tag }}
            </li>
          </ul>

          <button
            class="publish-button"
            type="submit"
            :aria-busy="isSubmitting"
          >
            Publish Article
          </button>
        </fieldset>
      </form>
    </div>
  </main>
</template>

<style scoped>
.editor-page {
  flex: 1;
  padding-block: 4rem;
}

.editor-container {
  width: min(100% - 2rem, 52rem);
}

.editor-container h1 {
  margin: 0 0 2rem;
  color: var(--ink);
  font-size: clamp(2rem, 6vw, 3rem);
}

.editor-message {
  color: var(--muted);
}

.editor-form,
.editor-form fieldset {
  display: grid;
  gap: 1.25rem;
}

.editor-form fieldset {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.editor-form label {
  display: grid;
  gap: 0.45rem;
  color: var(--ink);
  font-weight: 700;
}

.editor-form input,
.editor-form textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 0.85rem 1rem;
  border: 1px solid var(--line);
  border-radius: 0.45rem;
  color: var(--ink);
  background: var(--surface);
  font: inherit;
}

.editor-form textarea {
  resize: vertical;
  line-height: 1.6;
}

.editor-form input:focus,
.editor-form textarea:focus {
  border-color: var(--conduit-green-dark);
  outline: 3px solid rgb(75 157 75 / 15%);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tag-list li {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  color: #ffffff;
  background: #687078;
}

.tag-list button {
  padding: 0;
  border: 0;
  color: inherit;
  background: transparent;
  font-size: 1.1rem;
  cursor: pointer;
}

.publish-button {
  justify-self: end;
  padding: 0.75rem 1.1rem;
  border: 1px solid var(--conduit-green-dark);
  border-radius: 0.4rem;
  color: #ffffff;
  background: var(--conduit-green-dark);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.editor-form fieldset:disabled {
  opacity: 0.65;
}
</style>
