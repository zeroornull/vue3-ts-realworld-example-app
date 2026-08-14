<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
const { isAuthenticated, token } = storeToRefs(useAuthStore())
const errors = ref<ApiErrors>({})
const isSubmitting = ref(false)

const label = computed(() =>
  props.article.favorited ? 'Unfavorite' : 'Favorite',
)

async function toggleFavorite(): Promise<void> {
  if (!isAuthenticated.value || !token.value) {
    await router.push({
      name: 'login',
      query: { redirect: route.fullPath },
    })
    return
  }

  if (isSubmitting.value) {
    return
  }

  isSubmitting.value = true
  errors.value = {}

  try {
    if (props.article.favorited) {
      await articleStore.removeFavorite(props.article.slug, token.value)
    } else {
      await articleStore.addFavorite(props.article.slug, token.value)
    }
  } catch (error: unknown) {
    errors.value = toApiErrors(error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="article-actions">
    <button
      type="button"
      class="favorite-button"
      :class="{ active: article.favorited }"
      :disabled="isSubmitting"
      :aria-pressed="article.favorited"
      @click="toggleFavorite"
    >
      {{ isSubmitting ? 'Saving...' : label }}
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

.favorite-button {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--conduit-green-dark);
  border-radius: 0.35rem;
  color: var(--conduit-green-dark);
  background: transparent;
  cursor: pointer;
}

.favorite-button.active {
  color: #ffffff;
  background: var(--conduit-green);
}

.favorite-button:disabled {
  cursor: wait;
  opacity: 0.65;
}
</style>
