<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, watch } from 'vue'
import {
  RouterLink,
  useRoute,
  useRouter,
  type LocationQueryRaw,
} from 'vue-router'
import ArticleList from '../components/ArticleList.vue'
import TagList from '../components/TagList.vue'
import {
  createArticlesQuery,
  normalizeFeedTag,
  parseFeedPage,
  resolveFeedMode,
} from '../router/feed-query'
import { useAuthStore } from '../stores/auth'
import { useHomeStore } from '../stores/home'

defineOptions({ name: 'HomeView' })

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const homeStore = useHomeStore()
const { isAuthenticated, token } = storeToRefs(authStore)
const { articles, articlesCount, error, status, tags, tagsError, tagsStatus } =
  storeToRefs(homeStore)

const currentPage = computed(() => parseFeedPage(route.query.page))
const activeTag = computed(() => normalizeFeedTag(route.params.tag))
const feedMode = computed(() =>
  resolveFeedMode(route.query.feed, activeTag.value),
)
const articlesQuery = computed(() =>
  createArticlesQuery(currentPage.value, activeTag.value),
)

function loadFeed(): void {
  void homeStore.fetchFeed(
    feedMode.value === 'following' ? 'following' : 'global',
    articlesQuery.value,
    token.value,
  )
}

function loadTags(): void {
  void homeStore.fetchTags()
}

function selectPage(page: number): void {
  const query: LocationQueryRaw = { ...route.query }

  if (page > 1) {
    query.page = String(page)
  } else {
    delete query.page
  }

  void router.push({ path: route.path, query })
}

watch([feedMode, articlesQuery, token], loadFeed, { immediate: true })
onMounted(loadTags)
</script>

<template>
  <main class="home-page">
    <section class="banner">
      <div class="container">
        <p class="eyebrow">Vue 3 · TypeScript · Bun</p>
        <h1>conduit</h1>
        <p>A place to share your knowledge.</p>
      </div>
    </section>

    <section class="container page" aria-labelledby="iteration-title">
      <header class="iteration-intro">
        <p class="section-label">Global Feed · Your Feed · Tags</p>
        <h2 id="iteration-title">同一列表支持公开和认证数据源</h2>
        <p>feed query 决定请求公开文章，还是携带 Token 请求关注流。</p>
      </header>

      <div class="feed-layout">
        <section class="feed-card" aria-labelledby="feed-title">
          <nav class="feed-toggle" aria-label="Feed 类型">
            <RouterLink
              v-if="isAuthenticated"
              class="nav-link"
              :class="{ active: feedMode === 'following' }"
              :to="{ name: 'home', query: { feed: 'following' } }"
            >
              Your Feed
            </RouterLink>
            <RouterLink
              class="nav-link"
              :class="{ active: feedMode === 'global' }"
              :to="{ name: 'home' }"
            >
              Global Feed
            </RouterLink>
            <RouterLink
              v-if="activeTag"
              class="nav-link active"
              :to="{ name: 'tag', params: { tag: activeTag } }"
            >
              # {{ activeTag }}
            </RouterLink>
          </nav>

          <div class="feed-header">
            <h3 id="feed-title">Latest articles</h3>
            <span v-if="status === 'success'">
              {{ articlesCount }} articles
            </span>
            <span v-else-if="status === 'error'">Load failed</span>
            <span v-else>Waiting for articles</span>
          </div>

          <ArticleList
            :status="status"
            :articles="articles"
            :articles-count="articlesCount"
            :current-page="currentPage"
            :error="error"
            :empty-message="
              feedMode === 'following'
                ? 'Your feed is empty. Follow authors to see their articles here.'
                : undefined
            "
            @retry="loadFeed"
            @update:current-page="selectPage"
          />
        </section>

        <aside class="route-guide sidebar">
          <p class="event-label">Popular Tags</p>

          <p v-if="tagsStatus === 'idle' || tagsStatus === 'loading'">
            Loading tags...
          </p>

          <div v-else-if="tagsStatus === 'error'" class="sidebar-error">
            <p>{{ tagsError }}</p>
            <button type="button" @click="loadTags">Try again</button>
          </div>

          <p v-else-if="tags.length === 0">No tags are available yet.</p>

          <TagList v-else :tags="tags" linked />
        </aside>
      </div>
    </section>
  </main>
</template>

<style scoped>
.feed-toggle {
  gap: 1rem;
}

.sidebar-error {
  display: grid;
  gap: 0.75rem;
}

.sidebar-error button {
  width: fit-content;
  padding: 0.4rem 0.65rem;
  border: 1px solid var(--conduit-green-dark);
  border-radius: 0.35rem;
  color: var(--conduit-green-dark);
  background: transparent;
  cursor: pointer;
}
</style>
