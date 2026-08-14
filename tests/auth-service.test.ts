import { afterEach, describe, expect, it } from 'bun:test'
import { API_URL } from '../src/config'
import { loginUser, registerUser } from '../src/services/auth'

const originalFetch = globalThis.fetch

type CapturedRequest = {
  input: string | URL | Request
  init?: RequestInit
}

function captureSuccessfulRequest(): CapturedRequest[] {
  const requests: CapturedRequest[] = []

  globalThis.fetch = (async (input, init) => {
    requests.push({ input, init })
    return Response.json({
      user: {
        email: 'learner@example.com',
        token: 'server-token',
        username: 'learner',
        bio: null,
        image: null,
      },
    })
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
})
