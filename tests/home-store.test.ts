import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { useHomeStore } from '../src/stores/home'
import type { ArticleSummary } from '../src/types/realworld'

const originalFetch = globalThis.fetch

const demoArticle: ArticleSummary = {
  slug: 'learn-global-feed',
  title: 'Learn the Global Feed',
  description: 'Load articles through a typed store.',
  tagList: ['vue', 'typescript'],
  createdAt: '2026-08-14T08:00:00.000Z',
  updatedAt: '2026-08-14T08:00:00.000Z',
  favorited: false,
  favoritesCount: 3,
  author: {
    username: 'learner',
    bio: null,
    image: null,
    following: false,
  },
}

beforeEach(() => {
  setActivePinia(createPinia())
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('home store Global Feed', () => {
  it('exposes loading before storing a valid response', async () => {
    const homeStore = useHomeStore()

    globalThis.fetch = (async () => {
      await Bun.sleep(20)
      return Response.json({ articles: [demoArticle], articlesCount: 1 })
    }) as typeof fetch

    const request = homeStore.fetchGlobalFeed()
    await Bun.sleep(1)

    expect(homeStore.status).toBe('loading')
    expect(homeStore.isLoading).toBe(true)

    await request

    expect(homeStore.status).toBe('success')
    expect(homeStore.articles).toEqual([demoArticle])
    expect(homeStore.articlesCount).toBe(1)
    expect(homeStore.error).toBeNull()
  })

  it('treats an empty response as a successful empty feed', async () => {
    const homeStore = useHomeStore()

    globalThis.fetch = (async () =>
      Response.json({ articles: [], articlesCount: 0 })) as typeof fetch

    await homeStore.fetchGlobalFeed()

    expect(homeStore.status).toBe('success')
    expect(homeStore.articles).toEqual([])
    expect(homeStore.articlesCount).toBe(0)
  })

  it('exposes an HTTP error instead of leaving the feed loading', async () => {
    const homeStore = useHomeStore()

    globalThis.fetch = (async () =>
      Response.json({ error: 'outage' }, { status: 503 })) as typeof fetch

    await expect(homeStore.fetchGlobalFeed()).resolves.toBeUndefined()

    expect(homeStore.status).toBe('error')
    expect(homeStore.isLoading).toBe(false)
    expect(homeStore.error).toBe('Unable to load articles (HTTP 503).')
  })

  it('exposes a network error without an unhandled rejection', async () => {
    const homeStore = useHomeStore()

    globalThis.fetch = (async () => {
      throw new TypeError('network unavailable')
    }) as typeof fetch

    await expect(homeStore.fetchGlobalFeed()).resolves.toBeUndefined()

    expect(homeStore.status).toBe('error')
    expect(homeStore.error).toBe('Unable to connect to the article service.')
  })

  it('rejects a malformed 2xx response at the store boundary', async () => {
    const homeStore = useHomeStore()

    globalThis.fetch = (async () =>
      Response.json({
        articles: [{ title: 'missing fields' }],
      })) as typeof fetch

    await homeStore.fetchGlobalFeed()

    expect(homeStore.status).toBe('error')
    expect(homeStore.articles).toEqual([])
    expect(homeStore.error).toBe(
      'The article service returned an invalid response.',
    )
  })
})
