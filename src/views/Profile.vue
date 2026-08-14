<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, watch } from 'vue'
import {
  RouterLink,
  useRoute,
  useRouter,
  type LocationQueryRaw,
} from 'vue-router'
import ArticleList from '../components/ArticleList.vue'
import { createArticlesQuery, parseFeedPage } from '../router/feed-query'
import { useAuthStore } from '../stores/auth'
import { useProfileStore } from '../stores/profile'

defineOptions({ name: 'ProfileView' })

const props = defineProps<{
  username: string
}>()

const DEFAULT_AVATAR = '/default-avatar.svg'
const route = useRoute()
const router = useRouter()
const profileStore = useProfileStore()
const { token } = storeToRefs(useAuthStore())
const {
  articles,
  articlesCount,
  articlesError,
  articlesStatus,
  error,
  profile,
  status,
} = storeToRefs(profileStore)

const currentPage = computed(() => parseFeedPage(route.query.page))
const showFavorited = computed(() => route.name === 'profile-favorites')
const articlesQuery = computed(() =>
  createArticlesQuery(currentPage.value, null),
)
const avatarUrl = computed(() => profile.value?.image?.trim() || DEFAULT_AVATAR)
const articlesTitle = computed(() =>
  showFavorited.value
    ? `Articles favorited by ${props.username}`
    : `Articles by ${props.username}`,
)
const emptyArticlesMessage = computed(() =>
  showFavorited.value
    ? `${props.username} has not favorited any articles yet.`
    : `No articles published by ${props.username} yet.`,
)

function loadProfile(): void {
  void profileStore.fetchProfile(props.username, token.value)
}

function loadArticles(): void {
  if (showFavorited.value) {
    void profileStore.fetchFavoritedArticles(
      props.username,
      articlesQuery.value,
      token.value,
    )
  } else {
    void profileStore.fetchArticles(
      props.username,
      articlesQuery.value,
      token.value,
    )
  }
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

function showDefaultAvatar(event: Event): void {
  const image = event.currentTarget

  if (
    image instanceof HTMLImageElement &&
    !image.src.endsWith(DEFAULT_AVATAR)
  ) {
    image.src = DEFAULT_AVATAR
  }
}

watch([() => props.username, token], loadProfile, { immediate: true })
watch(
  [() => props.username, articlesQuery, token, showFavorited],
  loadArticles,
  {
    immediate: true,
  },
)
</script>

<template>
  <main class="profile-page">
    <section
      v-if="status === 'idle' || status === 'loading'"
      class="profile-state"
      aria-live="polite"
    >
      Loading profile...
    </section>

    <section v-else-if="status === 'error'" class="profile-state" role="alert">
      <h1>Profile unavailable</h1>
      <p>{{ error }}</p>
      <button type="button" @click="loadProfile">Try again</button>
    </section>

    <template v-else-if="profile">
      <header class="user-info">
        <div class="container user-info-content">
          <img
            class="user-img user-pic"
            :src="avatarUrl"
            :alt="`${profile.username}'s avatar`"
            @error="showDefaultAvatar"
          />
          <p class="section-label">Read-only profile</p>
          <h1>{{ profile.username }}</h1>
          <p class="profile-bio">
            {{ profile.bio || 'This user has not added a bio yet.' }}
          </p>
        </div>
      </header>

      <section
        class="container profile-content"
        aria-labelledby="articles-title"
      >
        <div class="feed-card">
          <nav class="feed-toggle" aria-label="Profile feeds">
            <RouterLink
              class="nav-link"
              :class="{ active: !showFavorited }"
              :aria-current="!showFavorited ? 'page' : undefined"
              :to="{ name: 'profile', params: { username } }"
            >
              My Articles
            </RouterLink>
            <RouterLink
              class="nav-link"
              :class="{ active: showFavorited }"
              :aria-current="showFavorited ? 'page' : undefined"
              :to="{ name: 'profile-favorites', params: { username } }"
            >
              Favorited Articles
            </RouterLink>
          </nav>

          <div class="feed-header">
            <h2 id="articles-title">{{ articlesTitle }}</h2>
            <span v-if="articlesStatus === 'success'">
              {{ articlesCount }} articles
            </span>
            <span v-else-if="articlesStatus === 'error'">Load failed</span>
            <span v-else>Waiting for articles</span>
          </div>

          <ArticleList
            :status="articlesStatus"
            :articles="articles"
            :articles-count="articlesCount"
            :current-page="currentPage"
            :error="articlesError"
            :empty-message="emptyArticlesMessage"
            @retry="loadArticles"
            @update:current-page="selectPage"
          />
        </div>
      </section>
    </template>

    <section v-else class="profile-state" role="alert">
      Profile response was empty.
    </section>
  </main>
</template>

<style scoped>
.profile-page {
  flex: 1;
}

.user-info {
  padding-block: 3.5rem;
  border-bottom: 1px solid var(--line);
  text-align: center;
  background:
    radial-gradient(circle at 20% 10%, rgb(92 184 92 / 14%), transparent 35%),
    var(--surface);
}

.user-info-content {
  display: grid;
  justify-items: center;
}

.user-img {
  width: 7rem;
  height: 7rem;
  margin-bottom: 1.25rem;
  border: 4px solid #ffffff;
  border-radius: 50%;
  background: #e0e0e0;
  box-shadow: 0 1rem 2.5rem rgb(39 43 48 / 16%);
  object-fit: cover;
}

.user-info h1 {
  margin: 0;
  color: var(--ink);
  font-size: clamp(2.1rem, 6vw, 3.4rem);
  letter-spacing: -0.035em;
}

.profile-bio {
  max-width: 38rem;
  margin: 0.85rem 0 0;
  color: var(--muted);
  line-height: 1.7;
}

.profile-content {
  width: min(100% - 2rem, 58rem);
  padding-block: 3rem 4rem;
}

.feed-header h2 {
  margin: 0;
  font-size: 1rem;
}

.profile-state {
  display: grid;
  width: min(100% - 2rem, 44rem);
  min-height: calc(100vh - 8rem);
  margin-inline: auto;
  place-content: center;
  justify-items: center;
  gap: 1rem;
  color: var(--muted);
  text-align: center;
}

.profile-state h1,
.profile-state p {
  margin: 0;
}

.profile-state h1 {
  color: var(--ink);
}

.profile-state button {
  padding: 0.55rem 0.8rem;
  border: 1px solid var(--conduit-green-dark);
  border-radius: 0.35rem;
  color: var(--conduit-green-dark);
  background: transparent;
  cursor: pointer;
}
</style>
