import { beforeEach, describe, expect, it } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { JWT_TOKEN_KEY, type TokenStorage } from '../src/services/jwt'
import { useAuthStore } from '../src/stores/auth'
import type { User } from '../src/types/realworld'

const demoUser: User = {
  email: 'learner@example.com',
  token: 'demo-token',
  username: 'local-learner',
  bio: null,
  image: null,
}

function createMemoryStorage(initialToken?: string): {
  storage: TokenStorage
  values: Map<string, string>
} {
  const values = new Map<string, string>()

  if (initialToken) {
    values.set(JWT_TOKEN_KEY, initialToken)
  }

  return {
    values,
    storage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => void values.delete(key),
    },
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('auth store', () => {
  it('hydrates from a locally saved token', () => {
    const authStore = useAuthStore()
    const { storage } = createMemoryStorage('saved-token')

    authStore.hydrateFromStorage(storage)

    expect(authStore.status).toBe('authenticated')
    expect(authStore.token).toBe('saved-token')
    expect(authStore.user).toBeNull()
    expect(authStore.isAuthenticated).toBe(true)
  })

  it('sets a local session and clears token and user on logout', () => {
    const authStore = useAuthStore()
    const { storage, values } = createMemoryStorage()

    authStore.setLocalSession(demoUser, storage)

    expect(authStore.currentUser).toEqual(demoUser)
    expect(values.get(JWT_TOKEN_KEY)).toBe(demoUser.token)

    authStore.logout(storage)

    expect(authStore.status).toBe('unauthenticated')
    expect(authStore.token).toBeNull()
    expect(authStore.user).toBeNull()
    expect(values.has(JWT_TOKEN_KEY)).toBe(false)
  })
})
