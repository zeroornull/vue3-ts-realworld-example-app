<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { toApiErrors } from '../services/errors'
import { useArticleStore } from '../stores/article'
import { useAuthStore } from '../stores/auth'
import type { ApiErrors, Comment } from '../types/realworld'
import ListErrors from './ListErrors.vue'

defineOptions({ name: 'ArticleComment' })

const props = defineProps<{
  slug: string
  comment: Comment
}>()

const articleStore = useArticleStore()
const { currentUser, token } = storeToRefs(useAuthStore())
const errors = ref<ApiErrors>({})
const isDeleting = ref(false)

const isCurrentUser = computed(
  () => currentUser.value?.username === props.comment.author.username,
)
const authorImage = computed(() => props.comment.author.image || '/favicon.svg')

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
}

async function deleteComment(): Promise<void> {
  if (isDeleting.value) {
    return
  }

  isDeleting.value = true
  errors.value = {}

  try {
    await articleStore.deleteComment(props.slug, props.comment.id, token.value)
  } catch (error: unknown) {
    errors.value = toApiErrors(error)
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <article class="card comment-card">
    <div class="card-block">
      <p>{{ comment.body }}</p>
    </div>
    <footer class="card-footer">
      <img
        :src="authorImage"
        :alt="comment.author.username"
        class="comment-author-img"
      />
      <RouterLink
        class="comment-author"
        :to="{
          name: 'profile',
          params: { username: comment.author.username },
        }"
      >
        {{ comment.author.username }}
      </RouterLink>
      <time :datetime="comment.createdAt">
        {{ formatDate(comment.createdAt) }}
      </time>
      <span v-if="isCurrentUser" class="mod-options">
        <button
          type="button"
          :disabled="isDeleting"
          :aria-label="`Delete comment ${comment.id}`"
          @click="deleteComment"
        >
          {{ isDeleting ? 'Deleting...' : 'Delete' }}
        </button>
      </span>
    </footer>
    <ListErrors :errors="errors" />
  </article>
</template>

<style scoped>
.comment-card {
  overflow: hidden;
}

.comment-card p {
  margin: 0;
  color: var(--ink);
  line-height: 1.65;
  white-space: pre-wrap;
}

.comment-author {
  color: var(--conduit-green-dark);
  font-weight: 700;
  text-decoration: none;
}

.comment-card time {
  color: var(--muted);
  font-size: 0.78rem;
}

.mod-options {
  margin-left: auto;
}

.mod-options button {
  padding: 0;
  border: 0;
  color: #b42318;
  background: transparent;
  cursor: pointer;
}
</style>
