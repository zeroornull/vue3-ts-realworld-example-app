<script setup lang="ts">
import { RouterLink } from 'vue-router'

withDefaults(
  defineProps<{
    name: string
    linked?: boolean
  }>(),
  {
    linked: false,
  },
)
</script>

<template>
  <RouterLink
    v-if="linked"
    class="tag-pill"
    :to="{ name: 'tag', params: { tag: name } }"
  >
    {{ name }}
  </RouterLink>
  <span v-else class="tag-pill">{{ name }}</span>
</template>

<style scoped>
.tag-pill {
  display: inline-flex;
  padding: 0.2rem 0.55rem;
  border: 1px solid #d7d9db;
  border-radius: 999px;
  color: var(--muted);
  font-size: 0.72rem;
  line-height: 1.3;
  text-decoration: none;
}

a.tag-pill:hover,
a.tag-pill.router-link-active {
  border-color: var(--conduit-green);
  color: var(--conduit-green-dark);
  background: rgb(92 184 92 / 8%);
}
</style>
