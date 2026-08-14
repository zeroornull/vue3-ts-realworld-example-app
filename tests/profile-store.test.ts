import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { useProfileStore } from '../src/stores/profile'
import type { ArticleSummary, Profile } from '../src/types/realworld'

const originalFetch = globalThis.fetch
const articlesQuery = { limit: 10, offset: 0 }

const demoProfile: Profile = {
  username: 'alice',
  bio: 'Vue and Bun learner.',
  image: null,
  following: false,
}

const demoArticle: ArticleSummary = {
  slug: 'alice-first-article',
  title: 'Alice first article',
  description: 'A profile article feed.',
  tagList: ['vue', 'bun'],
  createdAt: '2026-08-14T08:00:00.000Z',
  updatedAt: '2026-08-14T08:00:00.000Z',
  favorited: false,
  favoritesCount: 1,
  author: {
    username: 'alice',
    bio: demoProfile.bio,
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

describe('profile store', () => {
  it('exposes loading before storing a valid profile', async () => {
    const profileStore = useProfileStore()

    globalThis.fetch = (async () => {
      await Bun.sleep(20)
      return Response.json({ profile: demoProfile })
    }) as typeof fetch

    const request = profileStore.fetchProfile('alice', 'saved-token')
    await Bun.sleep(1)

    expect(profileStore.status).toBe('loading')

    await request

    expect(profileStore.status).toBe('success')
    expect(profileStore.profile).toEqual(demoProfile)
    expect(profileStore.error).toBeNull()
  })

  it('shows a specific profile-not-found error for 404', async () => {
    const profileStore = useProfileStore()
    let requestCount = 0

    globalThis.fetch = (async () => {
      requestCount += 1
      return Response.json(
        { errors: { profile: ['not found'] } },
        { status: 404 },
      )
    }) as typeof fetch

    await profileStore.fetchProfile('missing-user')

    expect(profileStore.status).toBe('error')
    expect(profileStore.profile).toBeNull()
    expect(profileStore.error).toBe('Profile not found.')
    expect(requestCount).toBe(3)
  })

  it('recovers when an eventually consistent profile appears on retry', async () => {
    const profileStore = useProfileStore()
    let requestCount = 0

    globalThis.fetch = (async () => {
      requestCount += 1

      if (requestCount < 3) {
        return Response.json(
          { errors: { profile: ['not found'] } },
          { status: 404 },
        )
      }

      return Response.json({ profile: demoProfile })
    }) as typeof fetch

    await profileStore.fetchProfile('alice')

    expect(requestCount).toBe(3)
    expect(profileStore.status).toBe('success')
    expect(profileStore.profile).toEqual(demoProfile)
  })

  it('rejects malformed profile responses at the store boundary', async () => {
    const profileStore = useProfileStore()

    globalThis.fetch = (async () =>
      Response.json({ profile: { username: 'alice' } })) as typeof fetch

    await profileStore.fetchProfile('alice')

    expect(profileStore.status).toBe('error')
    expect(profileStore.profile).toBeNull()
    expect(profileStore.error).toBe(
      'The profile service returned an invalid response.',
    )
  })

  it('keeps only the latest profile when route requests finish out of order', async () => {
    const profileStore = useProfileStore()
    const bobProfile: Profile = { ...demoProfile, username: 'bob' }

    globalThis.fetch = (async (input) => {
      if (String(input).endsWith('/profiles/alice')) {
        await Bun.sleep(25)
        return Response.json({ profile: demoProfile })
      }

      await Bun.sleep(5)
      return Response.json({ profile: bobProfile })
    }) as typeof fetch

    const aliceRequest = profileStore.fetchProfile('alice')
    const bobRequest = profileStore.fetchProfile('bob')

    await Promise.all([aliceRequest, bobRequest])

    expect(profileStore.profile).toEqual(bobProfile)
    expect(profileStore.status).toBe('success')
  })

  it('stores the server profile after follow and unfollow succeed', async () => {
    const profileStore = useProfileStore()
    const followedProfile: Profile = { ...demoProfile, following: true }
    const responses = [followedProfile, demoProfile]

    profileStore.profile = { ...demoProfile }
    profileStore.status = 'success'
    globalThis.fetch = (async () =>
      Response.json({ profile: responses.shift() })) as typeof fetch

    await profileStore.follow('alice', 'saved-token')

    expect(profileStore.profile).toEqual(followedProfile)
    expect(profileStore.followStatus).toBe('success')
    expect(profileStore.followError).toBeNull()

    await profileStore.unfollow('alice', 'saved-token')

    expect(profileStore.profile).toEqual(demoProfile)
    expect(profileStore.followStatus).toBe('success')
    expect(profileStore.followError).toBeNull()
  })

  it('keeps the original profile when a follow request fails', async () => {
    const profileStore = useProfileStore()
    const originalProfile = { ...demoProfile }

    profileStore.profile = originalProfile
    profileStore.status = 'success'
    globalThis.fetch = (async () =>
      Response.json(
        { errors: { profile: ['could not be followed'] } },
        { status: 500 },
      )) as typeof fetch

    await profileStore.follow('alice', 'saved-token')

    expect(profileStore.profile).toEqual(originalProfile)
    expect(profileStore.profile?.following).toBe(false)
    expect(profileStore.followStatus).toBe('error')
    expect(profileStore.followError).toBe(
      'Unable to update the follow status (HTTP 500).',
    )
  })
})

describe('profile article feed store', () => {
  it('stores a valid author feed', async () => {
    const profileStore = useProfileStore()

    globalThis.fetch = (async () =>
      Response.json({
        articles: [demoArticle],
        articlesCount: 1,
      })) as typeof fetch

    await profileStore.fetchArticles('alice', articlesQuery, 'saved-token')

    expect(profileStore.articlesStatus).toBe('success')
    expect(profileStore.articles).toEqual([demoArticle])
    expect(profileStore.articlesCount).toBe(1)
    expect(profileStore.articlesError).toBeNull()
  })

  it('treats an empty author feed as success', async () => {
    const profileStore = useProfileStore()

    globalThis.fetch = (async () =>
      Response.json({ articles: [], articlesCount: 0 })) as typeof fetch

    await profileStore.fetchArticles('alice', articlesQuery)

    expect(profileStore.articlesStatus).toBe('success')
    expect(profileStore.articles).toEqual([])
    expect(profileStore.articlesCount).toBe(0)
  })

  it('stores a valid favorited feed from the favorited query', async () => {
    const profileStore = useProfileStore()
    let requestUrl = ''
    const favoritedArticle: ArticleSummary = {
      ...demoArticle,
      slug: 'alice-favorite',
      title: 'Alice favorite',
      favorited: true,
    }

    globalThis.fetch = (async (input) => {
      requestUrl = String(input)
      return Response.json({
        articles: [favoritedArticle],
        articlesCount: 1,
      })
    }) as typeof fetch

    await profileStore.fetchFavoritedArticles(
      'alice',
      articlesQuery,
      'saved-token',
    )

    expect(requestUrl).toEndWith('/articles?limit=10&offset=0&favorited=alice')
    expect(profileStore.articlesStatus).toBe('success')
    expect(profileStore.articles).toEqual([favoritedArticle])
    expect(profileStore.articlesCount).toBe(1)
  })

  it('keeps only the latest tab response when feed requests overlap', async () => {
    const profileStore = useProfileStore()
    const favoritedArticle: ArticleSummary = {
      ...demoArticle,
      slug: 'latest-favorite',
      title: 'Latest favorite',
      favorited: true,
    }

    globalThis.fetch = (async (input) => {
      if (String(input).includes('author=alice')) {
        await Bun.sleep(25)
        return Response.json({ articles: [demoArticle], articlesCount: 1 })
      }

      await Bun.sleep(5)
      return Response.json({
        articles: [favoritedArticle],
        articlesCount: 1,
      })
    }) as typeof fetch

    const authoredRequest = profileStore.fetchArticles('alice', articlesQuery)
    const favoritedRequest = profileStore.fetchFavoritedArticles(
      'alice',
      articlesQuery,
    )

    await Promise.all([authoredRequest, favoritedRequest])

    expect(profileStore.articles).toEqual([favoritedArticle])
    expect(profileStore.articlesStatus).toBe('success')
  })

  it('keeps a loaded profile visible when its article feed fails', async () => {
    const profileStore = useProfileStore()
    profileStore.profile = { ...demoProfile }
    profileStore.status = 'success'

    globalThis.fetch = (async () =>
      Response.json({ error: 'outage' }, { status: 503 })) as typeof fetch

    await profileStore.fetchArticles('alice', articlesQuery)

    expect(profileStore.profile).toEqual(demoProfile)
    expect(profileStore.status).toBe('success')
    expect(profileStore.articlesStatus).toBe('error')
    expect(profileStore.articlesError).toBe(
      'Unable to load profile articles (HTTP 503).',
    )
  })
})
