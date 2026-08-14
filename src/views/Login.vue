<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ErrorMessages from '../components/ErrorMessages.vue'
import { getSafeRedirect } from '../router/redirect'
import { useAuthStore } from '../stores/auth'

defineOptions({ name: 'LoginView' })

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const { errors } = storeToRefs(authStore)

const email = ref('')
const password = ref('')
const isSubmitting = ref(false)

authStore.clearErrors()

async function submitLogin(): Promise<void> {
  if (isSubmitting.value) {
    return
  }

  isSubmitting.value = true

  try {
    await authStore.login({ email: email.value, password: password.value })
    await router.push(getSafeRedirect(route.query.redirect))
  } catch {
    // The store converts API and network failures into visible field errors.
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="route-page auth-page">
    <section class="route-card auth-card">
      <h1>Sign in</h1>
      <p>
        <RouterLink :to="{ name: 'register' }">Need an account?</RouterLink>
      </p>

      <ErrorMessages :errors="errors" />

      <form class="auth-form" @submit.prevent="submitLogin">
        <fieldset :disabled="isSubmitting">
          <input
            v-model.trim="email"
            name="email"
            type="email"
            autocomplete="email"
            placeholder="Email"
            required
          />
          <input
            v-model="password"
            name="password"
            type="password"
            autocomplete="current-password"
            placeholder="Password"
            required
          />
          <button class="auth-submit" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Signing in...' : 'Sign in' }}
          </button>
        </fieldset>
      </form>
    </section>
  </main>
</template>
