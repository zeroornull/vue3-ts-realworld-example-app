<script setup lang="ts">
defineProps<{
  pages: number[]
  currentPage: number
}>()

defineEmits<{
  'update:currentPage': [page: number]
}>()
</script>

<template>
  <nav v-if="pages.length" aria-label="Article pages">
    <ul class="pagination">
      <li
        v-for="page in pages"
        :key="page"
        class="page-item"
        :class="{ active: page === currentPage }"
      >
        <button
          class="page-link"
          type="button"
          :aria-current="page === currentPage ? 'page' : undefined"
          @click="$emit('update:currentPage', page)"
        >
          {{ page }}
        </button>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--line);
  list-style: none;
}

.page-link {
  min-width: 2.25rem;
  min-height: 2.25rem;
  border: 1px solid var(--line);
  border-radius: 0.35rem;
  color: var(--conduit-green-dark);
  background: var(--surface);
  cursor: pointer;
}

.page-item.active .page-link {
  border-color: var(--conduit-green-dark);
  color: #ffffff;
  background: var(--conduit-green);
}
</style>
