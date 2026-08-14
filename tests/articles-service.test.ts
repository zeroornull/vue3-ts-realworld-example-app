import { afterEach, describe, expect, it } from 'bun:test'
import { API_URL } from '../src/config'
import {
  getArticle,
  getGlobalArticles,
  getTags,
  getUserFeed,
  isArticleResponse,
  isArticleAuthor,
  isArticleSummary,
  isArticlesResponse,
  isTagsResponse,
} from '../src/services/articles'
import type { Article, ArticleSummary } from '../src/types/realworld'

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

const demoArticleDetail: Article = {
  ...demoArticle,
  body: '# Safe article body',
}

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('articles service', () => {
  it('gets a filtered Global Feed with limit and offset', async () => {
    const requests: Array<{
      input: string | URL | Request
      init?: RequestInit
    }> = []

    globalThis.fetch = (async (input, init) => {
      requests.push({ input, init })
      return Response.json({ articles: [demoArticle], articlesCount: 1 })
    }) as typeof fetch

    await getGlobalArticles({ limit: 10, offset: 20, tag: 'vue 3' })

    expect(String(requests[0]?.input)).toBe(
      `${API_URL}/articles?limit=10&offset=20&tag=vue+3`,
    )
    expect(requests[0]?.init?.method).toBe('GET')

    const headers = new Headers(requests[0]?.init?.headers)
    expect(headers.has('Authorization')).toBe(false)
  })

  it('gets Popular Tags from /tags', async () => {
    const requests: Array<string | URL | Request> = []

    globalThis.fetch = (async (input) => {
      requests.push(input)
      return Response.json({ tags: ['vue', 'bun'] })
    }) as typeof fetch

    await getTags()

    expect(String(requests[0])).toBe(`${API_URL}/tags`)
  })

  it('gets Your Feed with its token, limit, and offset', async () => {
    const requests: Array<{
      input: string | URL | Request
      init?: RequestInit
    }> = []

    globalThis.fetch = (async (input, init) => {
      requests.push({ input, init })
      return Response.json({ articles: [demoArticle], articlesCount: 1 })
    }) as typeof fetch

    await getUserFeed('saved-token', { limit: 10, offset: 10 })

    expect(String(requests[0]?.input)).toBe(
      `${API_URL}/articles/feed?limit=10&offset=10`,
    )
    expect(requests[0]?.init?.method).toBe('GET')

    const headers = new Headers(requests[0]?.init?.headers)
    expect(headers.get('Authorization')).toBe('Token saved-token')
  })

  it('gets one encoded article slug with an optional session token', async () => {
    const requests: Array<{
      input: string | URL | Request
      init?: RequestInit
    }> = []

    globalThis.fetch = (async (input, init) => {
      requests.push({ input, init })
      return Response.json({ article: demoArticleDetail })
    }) as typeof fetch

    await getArticle('safe/article slug', 'saved-token')

    expect(String(requests[0]?.input)).toBe(
      `${API_URL}/articles/safe%2Farticle%20slug`,
    )
    expect(new Headers(requests[0]?.init?.headers).get('Authorization')).toBe(
      'Token saved-token',
    )
  })
})

describe('article response guards', () => {
  it('accepts a complete articles response', () => {
    expect(isArticleAuthor(demoArticle.author)).toBe(true)
    expect(isArticleSummary(demoArticle)).toBe(true)
    expect(
      isArticlesResponse({ articles: [demoArticle], articlesCount: 1 }),
    ).toBe(true)
  })

  it('rejects malformed article fields and counts', () => {
    expect(
      isArticlesResponse({
        articles: [{ ...demoArticle, tagList: ['vue', 3] }],
        articlesCount: 1,
      }),
    ).toBe(false)
    expect(
      isArticlesResponse({
        articles: [
          {
            ...demoArticle,
            author: { ...demoArticle.author, following: 'no' },
          },
        ],
        articlesCount: 1,
      }),
    ).toBe(false)
    expect(
      isArticlesResponse({ articles: [demoArticle], articlesCount: -1 }),
    ).toBe(false)
    expect(
      isArticlesResponse({
        articles: [demoArticle],
        articlesCount: Number.MAX_SAFE_INTEGER + 1,
      }),
    ).toBe(false)
  })

  it('validates Popular Tags responses', () => {
    expect(isTagsResponse({ tags: ['vue', 'typescript'] })).toBe(true)
    expect(isTagsResponse({ tags: ['vue', 3] })).toBe(false)
    expect(isTagsResponse({})).toBe(false)
  })

  it('requires an article body on detail responses', () => {
    expect(isArticleResponse({ article: demoArticleDetail })).toBe(true)
    expect(isArticleResponse({ article: demoArticle })).toBe(false)
    expect(
      isArticleResponse({ article: { ...demoArticleDetail, body: null } }),
    ).toBe(false)
  })
})
