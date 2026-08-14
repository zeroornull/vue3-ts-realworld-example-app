<script setup lang="ts">
import VTag from './VTag.vue'

withDefaults(
  defineProps<{
    tags: string[]
    linked?: boolean
  }>(),
  {
    linked: false,
  },
)
</script>

<template>
  <ul class="tag-list">
    <li v-for="(tag, index) in tags" :key="`${tag}-${index}`">
      <VTag :name="tag" :linked="linked" />
    </li>
  </ul>
</template>

<style scoped>
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
