<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toApiErrors } from '../services/errors'
import { useArticleStore } from '../stores/article'
import { useAuthStore } from '../stores/auth'
import type { ApiErrors, Article } from '../types/realworld'
import ListErrors from './ListErrors.vue'

const props = defineProps<{
  article: Article
}>()

const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()
const { currentUser, isAuthenticated, token } = storeToRefs(useAuthStore())
const errors = ref<ApiErrors>({})
const isSubmitting = ref(false)

const isAuthor = computed(
  () =>
    isAuthenticated.value &&
    currentUser.value?.username === props.article.author.username,
)
const favoriteLabel = computed(() =>
  props.article.favorited ? 'Unfavorite' : 'Favorite',
)

async function requireSession(): Promise<string | null> {
  if (isAuthenticated.value && token.value) {
    return token.value
  }

  await router.push({
    name: 'login',
    query: { redirect: route.fullPath },
  })
  return null
}

async function toggleFavorite(): Promise<void> {
  if (isSubmitting.value) {
    return
  }

  const sessionToken = await requireSession()

  if (!sessionToken) {
    return
  }

  isSubmitting.value = true
  errors.value = {}

  try {
    if (props.article.favorited) {
      await articleStore.removeFavorite(props.article.slug, sessionToken)
    } else {
      await articleStore.addFavorite(props.article.slug, sessionToken)
    }
  } catch (error: unknown) {
    errors.value = toApiErrors(error)
  } finally {
    isSubmitting.value = false
  }
}

async function deleteCurrentArticle(): Promise<void> {
  if (isSubmitting.value) {
    return
  }

  const sessionToken = await requireSession()

  if (!sessionToken) {
    return
  }

  isSubmitting.value = true
  errors.value = {}

  try {
    await articleStore.deleteArticle(props.article.slug, sessionToken)
    await router.push({ name: 'home' })
  } catch (error: unknown) {
    errors.value = toApiErrors(error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="article-actions">
    <div v-if="isAuthor" class="action-buttons">
      <RouterLink
        class="article-button edit-button"
        :to="{
          name: 'article-edit',
          params: { slug: article.slug },
        }"
      >
        Edit Article
      </RouterLink>
      <button
        type="button"
        class="article-button delete-button"
        :disabled="isSubmitting"
        @click="deleteCurrentArticle"
      >
        Delete Article
      </button>
    </div>

    <button
      v-else
      type="button"
      class="article-button favorite-button"
      :class="{ active: article.favorited }"
      :disabled="isSubmitting"
      :aria-pressed="article.favorited"
      @click="toggleFavorite"
    >
      {{ isSubmitting ? 'Saving...' : favoriteLabel }}
      <span>({{ article.favoritesCount }})</span>
    </button>

    <ListErrors :errors="errors" />
  </div>
</template>

<style scoped>
.article-actions {
  display: grid;
  justify-items: start;
  gap: 0.65rem;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.article-button {
  padding: 0.5rem 0.75rem;
  border: 1px solid currentcolor;
  border-radius: 0.35rem;
  background: transparent;
  font: inherit;
  text-decoration: none;
  cursor: pointer;
}

.edit-button,
.favorite-button {
  color: var(--conduit-green-dark);
}

.delete-button {
  color: #b42318;
}

.favorite-button.active {
  color: #ffffff;
  background: var(--conduit-green);
}

.article-button:disabled {
  cursor: wait;
  opacity: 0.65;
}
</style>
