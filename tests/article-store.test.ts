import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { useArticleStore } from '../src/stores/article'
import { useHomeStore } from '../src/stores/home'
import type { Article, Comment } from '../src/types/realworld'

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

const demoComment: Comment = {
  id: 7,
  body: 'A useful comment.',
  createdAt: '2026-08-14T09:00:00.000Z',
  updatedAt: '2026-08-14T09:00:00.000Z',
  author: {
    username: 'commenter',
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

describe('article comments store', () => {
  it('loads a valid comment list', async () => {
    const articleStore = useArticleStore()

    globalThis.fetch = (async () =>
      Response.json({ comments: [demoComment] })) as typeof fetch

    await articleStore.fetchComments('safe-markdown')

    expect(articleStore.commentsStatus).toBe('success')
    expect(articleStore.comments).toEqual([demoComment])
    expect(articleStore.commentsError).toBeNull()
  })

  it('appends a complete created comment response', async () => {
    const articleStore = useArticleStore()

    globalThis.fetch = (async () =>
      Response.json({ comment: demoComment })) as typeof fetch

    await articleStore.createComment(
      'safe-markdown',
      'A useful comment.',
      'saved-token',
    )

    expect(articleStore.comments).toEqual([demoComment])
  })

  it('refetches comments when create returns an empty 204 response', async () => {
    const articleStore = useArticleStore()
    const requestMethods: string[] = []

    globalThis.fetch = (async (_input, init) => {
      requestMethods.push(init?.method ?? 'GET')

      if (requestMethods.length === 1) {
        return new Response(null, { status: 204 })
      }

      return Response.json({ comments: [demoComment] })
    }) as typeof fetch

    await articleStore.createComment(
      'safe-markdown',
      'A useful comment.',
      'saved-token',
    )

    expect(requestMethods).toEqual(['POST', 'GET'])
    expect(articleStore.comments).toEqual([demoComment])
  })

  it('rejects blank comments without making a request', async () => {
    const articleStore = useArticleStore()
    let requestCount = 0

    globalThis.fetch = (async () => {
      requestCount += 1
      return Response.json({ comment: demoComment })
    }) as typeof fetch

    await expect(
      articleStore.createComment('safe-markdown', '   ', 'saved-token'),
    ).rejects.toThrow('Comment body cannot be blank')
    expect(requestCount).toBe(0)
  })

  it('preserves existing comments when creation cannot reach the API', async () => {
    const articleStore = useArticleStore()
    articleStore.comments = [demoComment]

    globalThis.fetch = (async () => {
      throw new TypeError('network unavailable')
    }) as typeof fetch

    await expect(
      articleStore.createComment('safe-markdown', 'Keep me', 'saved-token'),
    ).rejects.toThrow()
    expect(articleStore.comments).toEqual([demoComment])
  })

  it('removes a comment locally after any successful 2xx response', async () => {
    const articleStore = useArticleStore()
    articleStore.comments = [demoComment]

    globalThis.fetch = (async () =>
      new Response(null, { status: 204 })) as typeof fetch

    await articleStore.deleteComment('safe-markdown', 7, 'saved-token')

    expect(articleStore.comments).toEqual([])
  })
})

describe('article favorites store', () => {
  it('syncs a favorite response to the detail and Home stores', async () => {
    const articleStore = useArticleStore()
    const homeStore = useHomeStore()
    const favoritedArticle = {
      ...demoArticle,
      favorited: true,
      favoritesCount: 3,
    }

    articleStore.article = { ...demoArticle }
    homeStore.articles = [{ ...demoArticle }]
    globalThis.fetch = (async () =>
      Response.json({ article: favoritedArticle })) as typeof fetch

    await articleStore.addFavorite('safe-markdown', 'saved-token')

    expect(articleStore.article?.favorited).toBe(true)
    expect(articleStore.article?.favoritesCount).toBe(3)
    expect(homeStore.articles[0]?.favorited).toBe(true)
    expect(homeStore.articles[0]?.favoritesCount).toBe(3)
  })

  it('does not mutate favorite state when the network request fails', async () => {
    const articleStore = useArticleStore()
    const homeStore = useHomeStore()

    articleStore.article = { ...demoArticle }
    homeStore.articles = [{ ...demoArticle }]
    globalThis.fetch = (async () => {
      throw new TypeError('network unavailable')
    }) as typeof fetch

    await expect(
      articleStore.addFavorite('safe-markdown', 'saved-token'),
    ).rejects.toThrow()

    expect(articleStore.article?.favorited).toBe(false)
    expect(homeStore.articles[0]?.favorited).toBe(false)
  })
})
