import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { useArticleStore } from '../src/stores/article'
import type { Article } from '../src/types/realworld'

const originalFetch = globalThis.fetch

const demoArticle: Article = {
  slug: 'safe-markdown',
  title: 'Safe Markdown',
  description: 'Render API Markdown without trusting it.',
  body: '# Hello from Markdown',
  tagList: ['vue', 'security'],
  createdAt: '2026-08-14T08:00:00.000Z',
  updatedAt: '2026-08-14T08:00:00.000Z',
  favorited: false,
  favoritesCount: 2,
  author: {
    username: 'security-learner',
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

describe('article detail store', () => {
  it('exposes loading before storing a valid article', async () => {
    const articleStore = useArticleStore()

    globalThis.fetch = (async () => {
      await Bun.sleep(20)
      return Response.json({ article: demoArticle })
    }) as typeof fetch

    const request = articleStore.fetchArticle('safe-markdown', 'saved-token')
    await Bun.sleep(1)

    expect(articleStore.status).toBe('loading')

    await request

    expect(articleStore.status).toBe('success')
    expect(articleStore.article).toEqual(demoArticle)
    expect(articleStore.error).toBeNull()
  })

  it('shows a specific error when the article does not exist', async () => {
    const articleStore = useArticleStore()

    globalThis.fetch = (async () =>
      Response.json(
        { errors: { article: ['not found'] } },
        { status: 404 },
      )) as typeof fetch

    await articleStore.fetchArticle('missing-article')

    expect(articleStore.status).toBe('error')
    expect(articleStore.article).toBeNull()
    expect(articleStore.error).toBe('Article not found.')
  })

  it('rejects malformed detail responses at the store boundary', async () => {
    const articleStore = useArticleStore()

    globalThis.fetch = (async () =>
      Response.json({
        article: { ...demoArticle, body: null },
      })) as typeof fetch

    await articleStore.fetchArticle('unsafe-response')

    expect(articleStore.status).toBe('error')
    expect(articleStore.article).toBeNull()
    expect(articleStore.error).toBe(
      'The article service returned an invalid response.',
    )
  })
})
