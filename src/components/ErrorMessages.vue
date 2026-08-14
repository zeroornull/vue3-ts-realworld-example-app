<script setup lang="ts">
import { computed } from 'vue'
import type { ApiErrors } from '../types/realworld'

const props = defineProps<{
  errors: ApiErrors
}>()

const messages = computed(() =>
  Object.entries(props.errors).flatMap(([field, fieldMessages]) =>
    fieldMessages.map((message) => `${field} ${message}`),
  ),
)
</script>

<template>
  <ul v-if="messages.length" class="error-messages" aria-live="polite">
    <li v-for="message in messages" :key="message">{{ message }}</li>
  </ul>
</template>

<style scoped>
.error-messages {
  margin: 0;
  padding-left: 1.25rem;
  color: #b85c5c;
  font-weight: 700;
  line-height: 1.6;
}
</style>
