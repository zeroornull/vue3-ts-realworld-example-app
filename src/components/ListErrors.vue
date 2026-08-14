<script setup lang="ts">
import type { ApiErrors } from '../types/realworld'

defineProps<{
  errors: ApiErrors
}>()
</script>

<template>
  <ul v-if="Object.keys(errors).length" class="error-messages" role="alert">
    <li v-for="(messages, field) in errors" :key="field">
      <span v-for="message in messages" :key="message">
        {{ field }} {{ message }}
      </span>
    </li>
  </ul>
</template>

<style scoped>
.error-messages {
  display: grid;
  gap: 0.35rem;
  margin: 0;
  padding: 0;
  color: #b42318;
  font-size: 0.9rem;
  list-style: none;
}

.error-messages li,
.error-messages span {
  display: grid;
}
</style>
