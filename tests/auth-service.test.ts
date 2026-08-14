import { afterEach, describe, expect, it } from 'bun:test'
import { API_URL } from '../src/config'
import {
  getCurrentUser,
  isUser,
  isUserResponse,
  loginUser,
  registerUser,
} from '../src/services/auth'
import type { User } from '../src/types/realworld'

const originalFetch = globalThis.fetch

const demoUser: User = {
  email: 'learner@example.com',
  token: 'server-token',
  username: 'learner',
  bio: null,
  image: null,
}

type CapturedRequest = {
  input: string | URL | Request
  init?: RequestInit
}

function captureSuccessfulRequest(): CapturedRequest[] {
  const requests: CapturedRequest[] = []

  globalThis.fetch = (async (input, init) => {
    requests.push({ input, init })
    return Response.json({ user: demoUser })
  }) as typeof fetch

  return requests
}

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('auth service', () => {
  it('posts the Login payload to /users/login', async () => {
    const requests = captureSuccessfulRequest()
    const credentials = { email: 'learner@example.com', password: 'secret' }

    await loginUser(credentials)

    expect(String(requests[0]?.input)).toBe(`${API_URL}/users/login`)
    expect(requests[0]?.init?.method).toBe('POST')
    expect(requests[0]?.init?.body).toBe(JSON.stringify({ user: credentials }))
  })

  it('posts the Registration payload to /users', async () => {
    const requests = captureSuccessfulRequest()
    const credentials = {
      username: 'learner',
      email: 'learner@example.com',
      password: 'secret',
    }

    await registerUser(credentials)

    expect(String(requests[0]?.input)).toBe(`${API_URL}/users`)
    expect(requests[0]?.init?.method).toBe('POST')
    expect(requests[0]?.init?.body).toBe(JSON.stringify({ user: credentials }))
  })

  it('gets the current user with the exact token header', async () => {
    const requests = captureSuccessfulRequest()

    await getCurrentUser('saved-token')

    expect(String(requests[0]?.input)).toBe(`${API_URL}/user`)
    expect(requests[0]?.init?.method).toBe('GET')

    const headers = new Headers(requests[0]?.init?.headers)
    expect(headers.get('Authorization')).toBe('Token saved-token')
  })
})

describe('auth response guards', () => {
  it('accepts a complete RealWorld user response', () => {
    expect(isUser(demoUser)).toBe(true)
    expect(isUserResponse({ user: demoUser })).toBe(true)
  })

  it('rejects missing and incorrectly typed user fields', () => {
    expect(isUserResponse({})).toBe(false)
    expect(isUserResponse({ user: { ...demoUser, image: false } })).toBe(false)
    expect(isUser({ ...demoUser, bio: undefined })).toBe(false)
  })
})
