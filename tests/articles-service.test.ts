import { afterEach, describe, expect, it } from 'bun:test'
import { API_URL } from '../src/config'
import {
  getGlobalArticles,
  isArticleAuthor,
  isArticleSummary,
  isArticlesResponse,
} from '../src/services/articles'
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

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('articles service', () => {
  it('gets the Global Feed from /articles', async () => {
    const requests: Array<{
      input: string | URL | Request
      init?: RequestInit
    }> = []

    globalThis.fetch = (async (input, init) => {
      requests.push({ input, init })
      return Response.json({ articles: [demoArticle], articlesCount: 1 })
    }) as typeof fetch

    await getGlobalArticles()

    expect(String(requests[0]?.input)).toBe(`${API_URL}/articles`)
    expect(requests[0]?.init?.method).toBe('GET')

    const headers = new Headers(requests[0]?.init?.headers)
    expect(headers.has('Authorization')).toBe(false)
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
  })
})
