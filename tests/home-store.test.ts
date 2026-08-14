import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { useHomeStore } from '../src/stores/home'
import type { ArticleSummary } from '../src/types/realworld'

const originalFetch = globalThis.fetch
const globalQuery = { limit: 10, offset: 0 }

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

    const request = homeStore.fetchGlobalFeed(globalQuery)
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

    await homeStore.fetchGlobalFeed(globalQuery)

    expect(homeStore.status).toBe('success')
    expect(homeStore.articles).toEqual([])
    expect(homeStore.articlesCount).toBe(0)
  })

  it('exposes an HTTP error instead of leaving the feed loading', async () => {
    const homeStore = useHomeStore()

    globalThis.fetch = (async () =>
      Response.json({ error: 'outage' }, { status: 503 })) as typeof fetch

    await expect(
      homeStore.fetchGlobalFeed(globalQuery),
    ).resolves.toBeUndefined()

    expect(homeStore.status).toBe('error')
    expect(homeStore.isLoading).toBe(false)
    expect(homeStore.error).toBe('Unable to load articles (HTTP 503).')
  })

  it('exposes a network error without an unhandled rejection', async () => {
    const homeStore = useHomeStore()

    globalThis.fetch = (async () => {
      throw new TypeError('network unavailable')
    }) as typeof fetch

    await expect(
      homeStore.fetchGlobalFeed(globalQuery),
    ).resolves.toBeUndefined()

    expect(homeStore.status).toBe('error')
    expect(homeStore.error).toBe('Unable to connect to the article service.')
  })

  it('rejects a malformed 2xx response at the store boundary', async () => {
    const homeStore = useHomeStore()

    globalThis.fetch = (async () =>
      Response.json({
        articles: [{ title: 'missing fields' }],
      })) as typeof fetch

    await homeStore.fetchGlobalFeed(globalQuery)

    expect(homeStore.status).toBe('error')
    expect(homeStore.articles).toEqual([])
    expect(homeStore.error).toBe(
      'The article service returned an invalid response.',
    )
  })
})

describe('home store Your Feed', () => {
  it('loads an authenticated feed and stores an empty result as success', async () => {
    const homeStore = useHomeStore()
    let requestUrl = ''
    let authorization = ''

    globalThis.fetch = (async (input, init) => {
      requestUrl = String(input)
      authorization = new Headers(init?.headers).get('Authorization') ?? ''
      return Response.json({ articles: [], articlesCount: 0 })
    }) as typeof fetch

    await homeStore.fetchFeed('following', globalQuery, 'saved-token')

    expect(requestUrl).toEndWith('/articles/feed?limit=10&offset=0')
    expect(authorization).toBe('Token saved-token')
    expect(homeStore.status).toBe('success')
    expect(homeStore.articles).toEqual([])
    expect(homeStore.articlesCount).toBe(0)
  })

  it('clears previous articles instead of requesting Your Feed without a token', async () => {
    const homeStore = useHomeStore()
    let requestCount = 0

    homeStore.articles = [demoArticle]
    homeStore.articlesCount = 1
    globalThis.fetch = (async () => {
      requestCount += 1
      return Response.json({ articles: [], articlesCount: 0 })
    }) as typeof fetch

    await homeStore.fetchFeed('following', globalQuery, null)

    expect(requestCount).toBe(0)
    expect(homeStore.status).toBe('error')
    expect(homeStore.articles).toEqual([])
    expect(homeStore.articlesCount).toBe(0)
    expect(homeStore.error).toBe('Sign in to view your feed.')
  })
})

describe('home store Popular Tags', () => {
  it('stores a valid tag list', async () => {
    const homeStore = useHomeStore()

    globalThis.fetch = (async () =>
      Response.json({ tags: ['vue', 'typescript', 'bun'] })) as typeof fetch

    await homeStore.fetchTags()

    expect(homeStore.tagsStatus).toBe('success')
    expect(homeStore.tags).toEqual(['vue', 'typescript', 'bun'])
    expect(homeStore.tagsError).toBeNull()
  })

  it('keeps an existing feed visible when tags fail', async () => {
    const homeStore = useHomeStore()

    globalThis.fetch = (async () =>
      Response.json({
        articles: [demoArticle],
        articlesCount: 1,
      })) as typeof fetch
    await homeStore.fetchGlobalFeed(globalQuery)

    globalThis.fetch = (async () =>
      Response.json({ error: 'outage' }, { status: 503 })) as typeof fetch
    await expect(homeStore.fetchTags()).resolves.toBeUndefined()

    expect(homeStore.tagsStatus).toBe('error')
    expect(homeStore.tags).toEqual([])
    expect(homeStore.tagsError).toBe(
      'Popular tags are temporarily unavailable.',
    )
    expect(homeStore.status).toBe('success')
    expect(homeStore.articles).toEqual([demoArticle])
  })
})
