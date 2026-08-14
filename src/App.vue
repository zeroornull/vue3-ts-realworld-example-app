<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
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
          <RouterLink class="nav-link" :to="{ name: 'login' }"
            >Sign in</RouterLink
          >
          <RouterLink class="nav-link" :to="{ name: 'register' }"
            >Sign up</RouterLink
          >
          <RouterLink
            class="nav-link"
            :to="{ name: 'profile', params: { username: 'alice' } }"
          >
            Profile
          </RouterLink>
        </nav>
      </div>
    </header>

    <RouterView />

    <footer class="site-footer">
      <div class="container">
        Iteration 3 · Router-only navigation skeleton.
      </div>
    </footer>
  </div>
</template>
