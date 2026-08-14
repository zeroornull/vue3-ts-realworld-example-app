import { afterEach, describe, expect, it } from 'bun:test'
import { API_URL } from '../src/config'
import {
  getFavoritedArticles,
  getProfileArticles,
} from '../src/services/articles'
import {
  getProfile,
  isProfile,
  isProfileResponse,
} from '../src/services/profiles'
import type { Profile } from '../src/types/realworld'

const originalFetch = globalThis.fetch

const demoProfile: Profile = {
  username: 'alice',
  bio: 'Vue and Bun learner.',
  image: null,
  following: false,
}

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('profile service', () => {
  it('gets an encoded username with an optional session token', async () => {
    let requestInput: string | URL | Request = ''
    let requestInit: RequestInit | undefined

    globalThis.fetch = (async (input, init) => {
      requestInput = input
      requestInit = init
      return Response.json({ profile: demoProfile })
    }) as typeof fetch

    await getProfile('alice/example', 'saved-token')

    expect(String(requestInput)).toBe(`${API_URL}/profiles/alice%2Fexample`)
    expect(new Headers(requestInit?.headers).get('Authorization')).toBe(
      'Token saved-token',
    )
  })

  it('gets one author feed with pagination and authentication', async () => {
    let requestInput: string | URL | Request = ''
    let requestInit: RequestInit | undefined

    globalThis.fetch = (async (input, init) => {
      requestInput = input
      requestInit = init
      return Response.json({ articles: [], articlesCount: 0 })
    }) as typeof fetch

    await getProfileArticles(
      'alice example',
      { limit: 10, offset: 10 },
      'saved-token',
    )

    expect(String(requestInput)).toBe(
      `${API_URL}/articles?limit=10&offset=10&author=alice+example`,
    )
    expect(new Headers(requestInit?.headers).get('Authorization')).toBe(
      'Token saved-token',
    )
  })

  it('gets one favorited feed with pagination and authentication', async () => {
    let requestInput: string | URL | Request = ''
    let requestInit: RequestInit | undefined

    globalThis.fetch = (async (input, init) => {
      requestInput = input
      requestInit = init
      return Response.json({ articles: [], articlesCount: 0 })
    }) as typeof fetch

    await getFavoritedArticles(
      'alice example',
      { limit: 10, offset: 20 },
      'saved-token',
    )

    expect(String(requestInput)).toBe(
      `${API_URL}/articles?limit=10&offset=20&favorited=alice+example`,
    )
    expect(new Headers(requestInit?.headers).get('Authorization')).toBe(
      'Token saved-token',
    )
  })
})

describe('profile response guards', () => {
  it('accepts a complete profile response', () => {
    expect(isProfile(demoProfile)).toBe(true)
    expect(isProfileResponse({ profile: demoProfile })).toBe(true)
  })

  it('rejects missing and incorrectly typed profile fields', () => {
    expect(isProfileResponse({ profile: { username: 'alice' } })).toBe(false)
    expect(
      isProfileResponse({
        profile: { ...demoProfile, image: 42 },
      }),
    ).toBe(false)
    expect(
      isProfileResponse({
        profile: { ...demoProfile, following: 'no' },
      }),
    ).toBe(false)
  })
})
