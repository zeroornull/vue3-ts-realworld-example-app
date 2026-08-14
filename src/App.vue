<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const { currentUser, status } = storeToRefs(authStore)

function logout(): void {
  authStore.logout()
  void router.push({ name: 'home' })
}
</script>

<template>
  <div class="app-shell">
    <header class="navbar">
      <div class="container navbar-content">
        <RouterLink class="navbar-brand" :to="{ name: 'home' }"
          >conduit</RouterLink
        >

        <nav class="nav-links" aria-label="主导航">
          <RouterLink class="nav-link" :to="{ name: 'home' }">Home</RouterLink>

          <template v-if="status === 'authenticated'">
            <RouterLink class="nav-link" :to="{ name: 'article-edit' }">
              New Article
            </RouterLink>
            <RouterLink class="nav-link" :to="{ name: 'settings' }">
              Settings
            </RouterLink>
            <RouterLink
              class="nav-link"
              :to="{
                name: 'profile',
                params: { username: currentUser?.username ?? 'local-user' },
              }"
            >
              {{ currentUser?.username ?? 'Local session' }}
            </RouterLink>
            <button class="nav-link nav-button" type="button" @click="logout">
              Log out
            </button>
          </template>

          <template v-else-if="status === 'unavailable'">
            <span class="nav-link">Session unavailable</span>
            <button class="nav-link nav-button" type="button" @click="logout">
              Log out
            </button>
          </template>

          <template v-else-if="status === 'unauthenticated'">
            <RouterLink class="nav-link" :to="{ name: 'login' }"
              >Sign in</RouterLink
            >
            <RouterLink class="nav-link" :to="{ name: 'register' }"
              >Sign up</RouterLink
            >
          </template>
        </nav>
      </div>
    </header>

    <RouterView />

    <footer class="site-footer">
      <div class="container">Iteration 13 · Settings and logout flow.</div>
    </footer>
  </div>
</template>
