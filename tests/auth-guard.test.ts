import { afterEach, describe, expect, it } from 'bun:test'
import { createPinia, type Pinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { installAuthGuard } from '../src/router/auth-guard'
import { JWT_TOKEN_KEY, type TokenStorage } from '../src/services/jwt'
import { useAuthStore } from '../src/stores/auth'
import type { User } from '../src/types/realworld'

const originalFetch = globalThis.fetch
const StubView = { template: '<div />' }

const demoUser: User = {
  email: 'learner@example.com',
  token: 'saved-token',
  username: 'local-learner',
  bio: null,
  image: null,
}

function createGuardedRouter(pinia: Pinia): Router {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: StubView },
      { path: '/login', name: 'login', component: StubView },
      {
        path: '/settings',
        name: 'settings',
        component: StubView,
        meta: { requiresAuth: true },
      },
      {
        path: '/editor/:slug?',
        name: 'article-edit',
        component: StubView,
        meta: { requiresAuth: true },
      },
    ],
  })

  installAuthGuard(router, pinia)
  return router
}

function createTokenStorage(token: string): TokenStorage {
  const values = new Map([[JWT_TOKEN_KEY, token]])

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => void values.delete(key),
  }
}

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('auth route guard', () => {
  it('redirects an unauthenticated settings visit to login', async () => {
    const router = createGuardedRouter(createPinia())

    await router.push('/settings')

    expect(router.currentRoute.value.fullPath).toBe('/login?redirect=/settings')
  })

  it('protects both new and existing article editor routes', async () => {
    const router = createGuardedRouter(createPinia())

    await router.push('/editor')
    expect(router.currentRoute.value.fullPath).toBe('/login?redirect=/editor')

    await router.push('/editor/example-slug')
    expect(router.currentRoute.value.fullPath).toBe(
      '/login?redirect=/editor/example-slug',
    )
  })

  it('waits for saved-session restoration before entering settings', async () => {
    const pinia = createPinia()
    const authStore = useAuthStore(pinia)
    const router = createGuardedRouter(pinia)
    let requestStarted = false

    authStore.hydrateFromStorage(createTokenStorage('saved-token'))
    globalThis.fetch = (async () => {
      requestStarted = true
      await Bun.sleep(20)
      return Response.json({ user: demoUser })
    }) as typeof fetch

    const navigation = router.push('/settings')
    await Bun.sleep(1)

    expect(requestStarted).toBe(true)
    expect(authStore.status).toBe('loading')
    expect(router.currentRoute.value.fullPath).not.toBe('/settings')

    await navigation

    expect(router.currentRoute.value.fullPath).toBe('/settings')
    expect(authStore.status).toBe('authenticated')
    expect(authStore.currentUser).toEqual(demoUser)
  })

  it('redirects an unauthenticated Your Feed visit to login', async () => {
    const router = createGuardedRouter(createPinia())

    await router.push('/?feed=following&page=2')

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe(
      '/?feed=following&page=2',
    )
  })

  it('restores a saved session before entering Your Feed', async () => {
    const pinia = createPinia()
    const authStore = useAuthStore(pinia)
    const router = createGuardedRouter(pinia)
    let requestStarted = false

    authStore.hydrateFromStorage(createTokenStorage('saved-token'))
    globalThis.fetch = (async () => {
      requestStarted = true
      await Bun.sleep(20)
      return Response.json({ user: demoUser })
    }) as typeof fetch

    const navigation = router.push('/?feed=following&page=2')
    await Bun.sleep(1)

    expect(requestStarted).toBe(true)
    expect(authStore.status).toBe('loading')
    expect(router.currentRoute.value.fullPath).not.toBe(
      '/?feed=following&page=2',
    )

    await navigation

    expect(router.currentRoute.value.fullPath).toBe('/?feed=following&page=2')
    expect(authStore.status).toBe('authenticated')
  })
})
