import { afterEach, describe, expect, it } from 'bun:test'
import { API_URL } from '../src/config'
import {
  addArticleFavorite,
  createArticleComment,
  deleteArticleComment,
  getArticleComments,
  isCommentResponse,
  isCommentsResponse,
  removeArticleFavorite,
} from '../src/services/articles'
import type { Comment } from '../src/types/realworld'

const originalFetch = globalThis.fetch

const demoComment: Comment = {
  id: 7,
  body: 'A useful comment.',
  createdAt: '2026-08-14T08:00:00.000Z',
  updatedAt: '2026-08-14T08:00:00.000Z',
  author: {
    username: 'commenter',
    bio: null,
    image: null,
    following: false,
  },
}

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('article comments service', () => {
  it('reads comments with an encoded slug and optional token', async () => {
    const requests: Array<{
      input: string | URL | Request
      init?: RequestInit
    }> = []

    globalThis.fetch = (async (input, init) => {
      requests.push({ input, init })
      return Response.json({ comments: [demoComment] })
    }) as typeof fetch

    await getArticleComments('safe/article', 'saved-token')

    expect(String(requests[0]?.input)).toBe(
      `${API_URL}/articles/safe%2Farticle/comments`,
    )
    expect(requests[0]?.init?.method).toBe('GET')
    expect(new Headers(requests[0]?.init?.headers).get('Authorization')).toBe(
      'Token saved-token',
    )
  })

  it('posts the RealWorld comment payload with authentication', async () => {
    let requestInput: string | URL | Request = ''
    let requestInit: RequestInit | undefined

    globalThis.fetch = (async (input, init) => {
      requestInput = input
      requestInit = init
      return Response.json({ comment: demoComment })
    }) as typeof fetch

    await createArticleComment('safe-markdown', 'Hello there', 'saved-token')

    expect(String(requestInput)).toBe(
      `${API_URL}/articles/safe-markdown/comments`,
    )
    expect(requestInit?.method).toBe('POST')
    expect(requestInit?.body).toBe(
      JSON.stringify({ comment: { body: 'Hello there' } }),
    )
    expect(new Headers(requestInit?.headers).get('Authorization')).toBe(
      'Token saved-token',
    )
  })

  it('deletes a comment using DELETE and accepts an empty 204 response', async () => {
    let requestInput: string | URL | Request = ''
    let requestInit: RequestInit | undefined

    globalThis.fetch = (async (input, init) => {
      requestInput = input
      requestInit = init
      return new Response(null, { status: 204 })
    }) as typeof fetch

    await deleteArticleComment('safe-markdown', 7, 'saved-token')

    expect(String(requestInput)).toBe(
      `${API_URL}/articles/safe-markdown/comments/7`,
    )
    expect(requestInit?.method).toBe('DELETE')
  })

  it('validates comment list and mutation responses', () => {
    expect(isCommentsResponse({ comments: [demoComment] })).toBe(true)
    expect(isCommentResponse({ comment: demoComment })).toBe(true)
    expect(
      isCommentsResponse({ comments: [{ ...demoComment, id: '7' }] }),
    ).toBe(false)
    expect(isCommentResponse({ comment: { body: 'missing fields' } })).toBe(
      false,
    )
  })
})

describe('article favorites service', () => {
  it('uses POST to favorite and DELETE to unfavorite', async () => {
    const requests: Array<{
      input: string | URL | Request
      init?: RequestInit
    }> = []

    globalThis.fetch = (async (input, init) => {
      requests.push({ input, init })
      return Response.json({})
    }) as typeof fetch

    await addArticleFavorite('safe-markdown', 'saved-token')
    await removeArticleFavorite('safe-markdown', 'saved-token')

    expect(String(requests[0]?.input)).toBe(
      `${API_URL}/articles/safe-markdown/favorite`,
    )
    expect(requests[0]?.init?.method).toBe('POST')
    expect(String(requests[1]?.input)).toBe(
      `${API_URL}/articles/safe-markdown/favorite`,
    )
    expect(requests[1]?.init?.method).toBe('DELETE')
  })
})
