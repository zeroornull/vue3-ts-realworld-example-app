<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
const { currentUser, isAuthenticated } = storeToRefs(authStore)

function logout(): void {
  authStore.logout()
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

          <template v-if="isAuthenticated">
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

          <template v-else>
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
      <div class="container">
        Iteration 5 · Local Pinia auth state, no login API yet.
      </div>
    </footer>
  </div>
</template>
