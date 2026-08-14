import { afterEach, describe, expect, it } from 'bun:test'
import { API_URL } from '../src/config'
import { request } from '../src/services/api'
import {
  ApiError,
  ConnectivityError,
  isApiErrorPayload,
  isApiErrors,
} from '../src/services/errors'

const originalFetch = globalThis.fetch

type CapturedRequest = {
  input: string | URL | Request
  init?: RequestInit
}

function respondWith(response: Response): CapturedRequest[] {
  const requests: CapturedRequest[] = []

  globalThis.fetch = (async (input, init) => {
    requests.push({ input, init })
    return response
  }) as typeof fetch

  return requests
}

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('request', () => {
  it('sends a GET request without Authorization when no token exists', async () => {
    const requests = respondWith(
      Response.json({ articles: [], articlesCount: 0 }),
    )

    await request('/articles')

    expect(requests).toHaveLength(1)
    expect(String(requests[0]?.input)).toBe(`${API_URL}/articles`)
    expect(requests[0]?.init?.method).toBe('GET')

    const headers = new Headers(requests[0]?.init?.headers)
    expect(headers.get('Accept')).toBe('application/json')
    expect(headers.has('Authorization')).toBe(false)
    expect(headers.has('Content-Type')).toBe(false)
  })

  it('serializes a POST body and sends the exact token header', async () => {
    const requests = respondWith(Response.json({ user: { username: 'alice' } }))
    const body = { user: { email: 'alice@example.com', password: 'secret' } }

    await request('/users/login', {
      method: 'POST',
      token: 'demo-token',
      body,
    })

    const headers = new Headers(requests[0]?.init?.headers)
    expect(headers.get('Authorization')).toBe('Token demo-token')
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(requests[0]?.init?.body).toBe(JSON.stringify(body))
  })

  it('returns parsed JSON for a successful response', async () => {
    respondWith(Response.json({ articles: [], articlesCount: 0 }))

    await expect(
      request<{ articles: unknown[]; articlesCount: number }>('/articles'),
    ).resolves.toEqual({ articles: [], articlesCount: 0 })
  })

  it('returns null for 204 and malformed JSON responses', async () => {
    respondWith(new Response(null, { status: 204 }))
    await expect(request('/user')).resolves.toBeNull()

    respondWith(new Response('{', { status: 200 }))
    await expect(request('/articles')).resolves.toBeNull()
  })

  it('throws ApiError with status and parsed data for HTTP failures', async () => {
    const data = { errors: { email: ['has already been taken'] } }
    respondWith(Response.json(data, { status: 422 }))

    try {
      await request('/users', { method: 'POST', body: { user: {} } })
      throw new Error('Expected request to reject')
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ApiError)

      if (!(error instanceof ApiError)) {
        throw error
      }

      expect(error.status).toBe(422)
      expect(error.data).toEqual(data)
    }
  })

  it('converts fetch failures into ConnectivityError', async () => {
    globalThis.fetch = (async () => {
      throw new TypeError('network unavailable')
    }) as typeof fetch

    await expect(request('/articles')).rejects.toBeInstanceOf(ConnectivityError)
  })
})

describe('API error guards', () => {
  it('recognizes RealWorld error maps and payloads', () => {
    const errors = { email: ['is invalid'], password: ['is too short'] }

    expect(isApiErrors(errors)).toBe(true)
    expect(isApiErrorPayload({ errors })).toBe(true)
    expect(isApiErrors({ email: 'is invalid' })).toBe(false)
    expect(isApiErrorPayload({ errors: null })).toBe(false)
  })
})
