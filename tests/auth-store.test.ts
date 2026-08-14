import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError, ConnectivityError } from '../src/services/errors'
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

const originalFetch = globalThis.fetch

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

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('auth store', () => {
  it('hydrates from a locally saved token', () => {
    const authStore = useAuthStore()
    const { storage } = createMemoryStorage('saved-token')

    authStore.hydrateFromStorage(storage)

    expect(authStore.status).toBe('loading')
    expect(authStore.token).toBe('saved-token')
    expect(authStore.user).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
  })

  it('restores a valid saved session from GET /user', async () => {
    const authStore = useAuthStore()
    const { storage, values } = createMemoryStorage('saved-token')

    globalThis.fetch = (async () =>
      Response.json({ user: demoUser })) as typeof fetch

    authStore.hydrateFromStorage(storage)
    await authStore.restoreSession(storage)

    expect(authStore.status).toBe('authenticated')
    expect(authStore.currentUser).toEqual(demoUser)
    expect(values.get(JWT_TOKEN_KEY)).toBe(demoUser.token)
  })

  it('clears a rejected token after a 4xx response', async () => {
    const authStore = useAuthStore()
    const { storage, values } = createMemoryStorage('expired-token')

    globalThis.fetch = (async () =>
      Response.json(
        { errors: { token: ['is invalid'] } },
        { status: 401 },
      )) as typeof fetch

    authStore.hydrateFromStorage(storage)
    await expect(authStore.restoreSession(storage)).resolves.toBeUndefined()

    expect(authStore.status).toBe('unauthenticated')
    expect(authStore.token).toBeNull()
    expect(authStore.user).toBeNull()
    expect(values.has(JWT_TOKEN_KEY)).toBe(false)
  })

  it('keeps the token unavailable after a 5xx response', async () => {
    const authStore = useAuthStore()
    const { storage, values } = createMemoryStorage('saved-token')

    globalThis.fetch = (async () =>
      Response.json(
        { error: 'temporary outage' },
        { status: 503 },
      )) as typeof fetch

    authStore.hydrateFromStorage(storage)
    await authStore.restoreSession(storage)

    expect(authStore.status).toBe('unavailable')
    expect(authStore.token).toBe('saved-token')
    expect(values.get(JWT_TOKEN_KEY)).toBe('saved-token')
  })

  it('keeps the token unavailable after a network failure', async () => {
    const authStore = useAuthStore()
    const { storage, values } = createMemoryStorage('saved-token')

    globalThis.fetch = (async () => {
      throw new TypeError('network unavailable')
    }) as typeof fetch

    authStore.hydrateFromStorage(storage)
    await expect(authStore.restoreSession(storage)).resolves.toBeUndefined()

    expect(authStore.status).toBe('unavailable')
    expect(authStore.token).toBe('saved-token')
    expect(values.get(JWT_TOKEN_KEY)).toBe('saved-token')
  })

  it('keeps the token when a 2xx response has no body or malformed JSON', async () => {
    for (const response of [
      new Response(null, { status: 200 }),
      new Response('{', { status: 200 }),
    ]) {
      setActivePinia(createPinia())
      const authStore = useAuthStore()
      const { storage, values } = createMemoryStorage('saved-token')

      globalThis.fetch = (async () => response) as typeof fetch

      authStore.hydrateFromStorage(storage)
      await authStore.restoreSession(storage)

      expect(authStore.status).toBe('unavailable')
      expect(authStore.token).toBe('saved-token')
      expect(values.get(JWT_TOKEN_KEY)).toBe('saved-token')
    }
  })

  it('keeps the token when a 2xx response has a missing or invalid user', async () => {
    for (const body of [
      { message: 'missing user' },
      { user: { ...demoUser, image: false } },
    ]) {
      setActivePinia(createPinia())
      const authStore = useAuthStore()
      const { storage, values } = createMemoryStorage('saved-token')

      globalThis.fetch = (async () => Response.json(body)) as typeof fetch

      authStore.hydrateFromStorage(storage)
      await authStore.restoreSession(storage)

      expect(authStore.status).toBe('unavailable')
      expect(authStore.token).toBe('saved-token')
      expect(authStore.user).toBeNull()
      expect(values.get(JWT_TOKEN_KEY)).toBe('saved-token')
    }
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

  it('persists the user returned by real login and registration requests', async () => {
    const authStore = useAuthStore()
    const { storage, values } = createMemoryStorage()

    globalThis.fetch = (async () =>
      Response.json({ user: demoUser })) as typeof fetch

    await authStore.login(
      { email: demoUser.email, password: 'secret' },
      storage,
    )
    expect(authStore.currentUser).toEqual(demoUser)
    expect(values.get(JWT_TOKEN_KEY)).toBe(demoUser.token)

    authStore.logout(storage)

    await authStore.register(
      {
        username: demoUser.username,
        email: demoUser.email,
        password: 'secret',
      },
      storage,
    )
    expect(authStore.currentUser).toEqual(demoUser)
    expect(values.get(JWT_TOKEN_KEY)).toBe(demoUser.token)
  })

  it('exposes API field errors without an unhandled rejection', async () => {
    const authStore = useAuthStore()
    const data = { errors: { email: ['or password is invalid'] } }

    globalThis.fetch = (async () =>
      Response.json(data, { status: 422 })) as typeof fetch

    await expect(
      authStore.login({ email: 'wrong@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(ApiError)
    expect(authStore.errors).toEqual(data.errors)
    expect(authStore.status).toBe('unauthenticated')
  })

  it('preserves 401 authentication errors for the form', async () => {
    const authStore = useAuthStore()
    const data = { errors: { credentials: ['are invalid'] } }

    globalThis.fetch = (async () =>
      Response.json(data, { status: 401 })) as typeof fetch

    await expect(
      authStore.login({ email: 'wrong@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(ApiError)
    expect(authStore.errors).toEqual(data.errors)

    authStore.clearErrors()
    expect(authStore.errors).toEqual({})
  })

  it('converts network failures into visible connectivity errors', async () => {
    const authStore = useAuthStore()

    globalThis.fetch = (async () => {
      throw new TypeError('network unavailable')
    }) as typeof fetch

    await expect(
      authStore.login({ email: demoUser.email, password: 'secret' }),
    ).rejects.toBeInstanceOf(ConnectivityError)
    expect(authStore.errors).toEqual({
      network: ['is unavailable; check the API address and try again'],
    })
  })

  it('updates settings, omits an empty password, and persists a rotated token', async () => {
    const authStore = useAuthStore()
    const { storage, values } = createMemoryStorage()
    const updatedUser: User = {
      email: 'updated@example.com',
      token: 'rotated-token',
      username: 'updated-learner',
      bio: 'Updated bio.',
      image: 'https://example.com/avatar.png',
    }
    let requestBody = ''

    authStore.setLocalSession(demoUser, storage)
    globalThis.fetch = (async (_input, init) => {
      requestBody = String(init?.body)
      return Response.json({ user: updatedUser })
    }) as typeof fetch

    await authStore.updateUser(
      {
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio,
        image: updatedUser.image,
        password: '',
      },
      storage,
    )

    expect(JSON.parse(requestBody)).toEqual({
      user: {
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio,
        image: updatedUser.image,
      },
    })
    expect(authStore.status).toBe('authenticated')
    expect(authStore.currentUser).toEqual(updatedUser)
    expect(values.get(JWT_TOKEN_KEY)).toBe(updatedUser.token)
    expect(authStore.errors).toEqual({})
  })

  it('keeps the current session when a settings update fails', async () => {
    const authStore = useAuthStore()
    const { storage, values } = createMemoryStorage()
    const data = { errors: { username: ['has already been taken'] } }

    authStore.setLocalSession(demoUser, storage)
    globalThis.fetch = (async () =>
      Response.json(data, { status: 422 })) as typeof fetch

    await expect(
      authStore.updateUser(
        {
          username: 'taken-name',
          email: demoUser.email,
          bio: demoUser.bio,
          image: demoUser.image,
        },
        storage,
      ),
    ).rejects.toBeInstanceOf(ApiError)

    expect(authStore.status).toBe('authenticated')
    expect(authStore.currentUser).toEqual(demoUser)
    expect(values.get(JWT_TOKEN_KEY)).toBe(demoUser.token)
    expect(authStore.errors).toEqual(data.errors)
  })

  it('keeps the current session when settings cannot reach the API', async () => {
    const authStore = useAuthStore()
    const { storage, values } = createMemoryStorage()

    authStore.setLocalSession(demoUser, storage)
    globalThis.fetch = (async () => {
      throw new TypeError('network unavailable')
    }) as typeof fetch

    await expect(
      authStore.updateUser(
        {
          username: demoUser.username,
          email: demoUser.email,
          bio: demoUser.bio,
          image: demoUser.image,
        },
        storage,
      ),
    ).rejects.toBeInstanceOf(ConnectivityError)

    expect(authStore.status).toBe('authenticated')
    expect(authStore.currentUser).toEqual(demoUser)
    expect(values.get(JWT_TOKEN_KEY)).toBe(demoUser.token)
    expect(authStore.errors).toEqual({
      network: ['is unavailable; check the API address and try again'],
    })
  })
})
