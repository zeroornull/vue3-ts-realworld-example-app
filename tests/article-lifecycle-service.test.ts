import { afterEach, describe, expect, it } from 'bun:test'
import { API_URL } from '../src/config'
import {
  createArticle,
  deleteArticle,
  updateArticle,
} from '../src/services/articles'
import type { ArticleDraft } from '../src/types/realworld'

const originalFetch = globalThis.fetch

const draft: ArticleDraft = {
  title: 'Learn article mutations',
  description: 'Create, edit, and delete one article.',
  body: '# Article lifecycle',
  tagList: ['vue', 'bun'],
}

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('article lifecycle service', () => {
  it('creates an article with the RealWorld payload and token', async () => {
    let requestInput: string | URL | Request = ''
    let requestInit: RequestInit | undefined

    globalThis.fetch = (async (input, init) => {
      requestInput = input
      requestInit = init
      return Response.json({})
    }) as typeof fetch

    await createArticle(draft, 'saved-token')

    expect(String(requestInput)).toBe(`${API_URL}/articles`)
    expect(requestInit?.method).toBe('POST')
    expect(requestInit?.body).toBe(JSON.stringify({ article: draft }))
    expect(new Headers(requestInit?.headers).get('Authorization')).toBe(
      'Token saved-token',
    )
  })

  it('updates an encoded article slug with PUT', async () => {
    let requestInput: string | URL | Request = ''
    let requestInit: RequestInit | undefined

    globalThis.fetch = (async (input, init) => {
      requestInput = input
      requestInit = init
      return Response.json({})
    }) as typeof fetch

    await updateArticle('old/article slug', draft, 'saved-token')

    expect(String(requestInput)).toBe(
      `${API_URL}/articles/old%2Farticle%20slug`,
    )
    expect(requestInit?.method).toBe('PUT')
    expect(requestInit?.body).toBe(JSON.stringify({ article: draft }))
    expect(new Headers(requestInit?.headers).get('Authorization')).toBe(
      'Token saved-token',
    )
  })

  it('deletes an encoded slug and accepts an empty 204 response', async () => {
    let requestInput: string | URL | Request = ''
    let requestInit: RequestInit | undefined

    globalThis.fetch = (async (input, init) => {
      requestInput = input
      requestInit = init
      return new Response(null, { status: 204 })
    }) as typeof fetch

    await deleteArticle('old/article slug', 'saved-token')

    expect(String(requestInput)).toBe(
      `${API_URL}/articles/old%2Farticle%20slug`,
    )
    expect(requestInit?.method).toBe('DELETE')
    expect(new Headers(requestInit?.headers).get('Authorization')).toBe(
      'Token saved-token',
    )
  })
})
