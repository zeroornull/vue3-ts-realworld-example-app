<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { toApiErrors } from '../services/errors'
import { useArticleStore } from '../stores/article'
import { useAuthStore } from '../stores/auth'
import type { ApiErrors } from '../types/realworld'
import ListErrors from './ListErrors.vue'

const props = defineProps<{
  slug: string
}>()

const articleStore = useArticleStore()
const { currentUser, token } = storeToRefs(useAuthStore())
const body = ref('')
const errors = ref<ApiErrors>({})
const isSubmitting = ref(false)

const canSubmit = computed(
  () => Boolean(body.value.trim()) && !isSubmitting.value,
)
const userImage = computed(() => currentUser.value?.image || '/favicon.svg')

async function submitComment(): Promise<void> {
  if (isSubmitting.value) {
    return
  }

  isSubmitting.value = true
  errors.value = {}

  try {
    await articleStore.createComment(props.slug, body.value, token.value)
    body.value = ''
  } catch (error: unknown) {
    errors.value = toApiErrors(error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="comment-editor">
    <ListErrors :errors="errors" />

    <form class="card comment-form" @submit.prevent="submitComment">
      <div class="card-block">
        <textarea
          v-model="body"
          name="comment"
          placeholder="Write a comment..."
          rows="3"
          :disabled="isSubmitting"
          aria-label="Comment body"
        ></textarea>
      </div>
      <footer class="card-footer">
        <img
          :src="userImage"
          :alt="currentUser?.username ?? 'Current user'"
          class="comment-author-img"
        />
        <button type="submit" :disabled="!canSubmit">
          {{ isSubmitting ? 'Posting...' : 'Post Comment' }}
        </button>
      </footer>
    </form>
  </div>
</template>

<style scoped>
.comment-editor {
  display: grid;
  gap: 0.75rem;
}

.comment-form {
  overflow: hidden;
}

.comment-form textarea {
  width: 100%;
  min-height: 7rem;
  padding: 1rem;
  border: 0;
  color: var(--ink);
  font: inherit;
  line-height: 1.6;
  resize: vertical;
}

.comment-form textarea:focus {
  outline: 3px solid rgb(92 184 92 / 25%);
  outline-offset: -3px;
}

.comment-form button {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--conduit-green-dark);
  border-radius: 0.35rem;
  color: #ffffff;
  background: var(--conduit-green);
  cursor: pointer;
}

.comment-form button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
</style>
