<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ListErrors from '../components/ListErrors.vue'
import { useAuthStore } from '../stores/auth'

defineOptions({ name: 'SettingsView' })

const router = useRouter()
const authStore = useAuthStore()
const { currentUser, errors } = storeToRefs(authStore)
const isSubmitting = ref(false)
const form = reactive({
  image: '',
  username: '',
  bio: '',
  email: '',
  password: '',
})

authStore.clearErrors()

watch(
  currentUser,
  (user) => {
    form.image = user?.image ?? ''
    form.username = user?.username ?? ''
    form.bio = user?.bio ?? ''
    form.email = user?.email ?? ''
    form.password = ''
  },
  { immediate: true },
)

async function updateSettings(): Promise<void> {
  if (isSubmitting.value) {
    return
  }

  isSubmitting.value = true

  try {
    const user = await authStore.updateUser({
      image: form.image.trim(),
      username: form.username.trim(),
      bio: form.bio,
      email: form.email.trim(),
      password: form.password,
    })

    await router.push({
      name: 'profile',
      params: { username: user.username },
    })
  } catch {
    // The auth store keeps the existing session and exposes visible errors.
  } finally {
    isSubmitting.value = false
  }
}

function logout(): void {
  authStore.logout()
  void router.push({ name: 'home' })
}
</script>

<template>
  <main class="settings-page route-page">
    <section class="route-card settings-card">
      <p class="route-kicker">Protected account settings</p>
      <h1>Your Settings</h1>

      <ListErrors :errors="errors" />

      <form class="settings-form" @submit.prevent="updateSettings">
        <fieldset :disabled="isSubmitting">
          <label>
            <span>Profile picture URL</span>
            <input
              v-model="form.image"
              type="text"
              name="image"
              autocomplete="url"
              placeholder="URL of profile picture"
            />
          </label>

          <label>
            <span>Username</span>
            <input
              v-model="form.username"
              type="text"
              name="username"
              autocomplete="username"
              placeholder="Your username"
              required
            />
          </label>

          <label>
            <span>Bio</span>
            <textarea
              v-model="form.bio"
              name="bio"
              rows="8"
              placeholder="Short bio about you"
            ></textarea>
          </label>

          <label>
            <span>Email</span>
            <input
              v-model="form.email"
              type="email"
              name="email"
              autocomplete="email"
              placeholder="Email"
              required
            />
          </label>

          <label>
            <span>New password</span>
            <input
              v-model="form.password"
              type="password"
              name="password"
              autocomplete="new-password"
              placeholder="Password"
            />
          </label>

          <button type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Updating...' : 'Update Settings' }}
          </button>
        </fieldset>
      </form>

      <hr />

      <button
        class="logout-button btn btn-outline-danger"
        type="button"
        @click="logout"
      >
        Or click here to logout.
      </button>
    </section>
  </main>
</template>

<style scoped>
.settings-card {
  max-width: 38rem;
}

.settings-form fieldset {
  display: grid;
  gap: 1rem;
  margin: 0;
  padding: 0;
  border: 0;
}

.settings-form label {
  display: grid;
  gap: 0.4rem;
  color: var(--muted);
  font-size: 0.85rem;
  font-weight: 700;
}

.settings-form input,
.settings-form textarea {
  width: 100%;
  padding: 0.75rem 0.9rem;
  border: 1px solid #c7cbcf;
  border-radius: 0.35rem;
  color: var(--ink);
  background: #ffffff;
  font: inherit;
}

.settings-form input {
  min-height: 3rem;
}

.settings-form textarea {
  min-height: 9rem;
  resize: vertical;
}

.settings-form input:focus,
.settings-form textarea:focus {
  border-color: var(--conduit-green);
  outline: 3px solid rgb(92 184 92 / 20%);
}

.settings-form button {
  justify-self: end;
  padding: 0.7rem 1rem;
  border: 1px solid var(--conduit-green-dark);
  border-radius: 0.35rem;
  color: #ffffff;
  background: var(--conduit-green);
  cursor: pointer;
}

.settings-form button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.settings-card hr {
  width: 100%;
  margin: 0;
  border: 0;
  border-top: 1px solid var(--line);
}

.logout-button {
  width: fit-content;
  padding: 0.65rem 0.9rem;
  border: 1px solid #b42318;
  border-radius: 0.35rem;
  color: #b42318;
  background: transparent;
  cursor: pointer;
}
</style>
