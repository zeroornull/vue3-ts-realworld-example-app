import { expect, test, type Page } from '@playwright/test'

const token = 'reader-token'

const aliceProfile = {
  username: 'alice',
  bio: 'Writes deterministic browser fixtures.',
  image: null,
  following: false,
}

const reader = {
  username: 'reader',
  email: 'reader@example.com',
  bio: 'Reads deterministic browser fixtures.',
  image: null,
  token,
}

function createArticle(slug: string, title: string, favorited = false) {
  return {
    slug,
    title,
    description: `${title} description.`,
    tagList: ['playwright', 'profile'],
    createdAt: '2026-08-15T00:00:00.000Z',
    updatedAt: '2026-08-15T00:00:00.000Z',
    favorited,
    favoritesCount: favorited ? 1 : 0,
    author: aliceProfile,
  }
}

async function mockSession(page: Page): Promise<void> {
  await page.addInitScript((savedToken) => {
    localStorage.setItem('jwtToken', savedToken)
  }, token)
  await page.route(/\/api\/user$/, async (route) => {
    await route.fulfill({ json: { user: reader } })
  })
}

async function mockEmptyHome(page: Page): Promise<void> {
  await page.route(/\/api\/articles(?:\?.*)?$/, async (route) => {
    await route.fulfill({ json: { articles: [], articlesCount: 0 } })
  })
  await page.route(/\/api\/tags$/, async (route) => {
    await route.fulfill({ json: { tags: [] } })
  })
}

test('switches a public profile between authored and favorited articles', async ({
  page,
}) => {
  const authoredArticle = createArticle('authored-article', 'Authored article')
  const favoritedArticle = createArticle(
    'favorited-article',
    'Favorited article',
    true,
  )
  const articleQueries: URL[] = []

  await page.route(/\/api\/profiles\/alice$/, async (route) => {
    await route.fulfill({ json: { profile: aliceProfile } })
  })
  await page.route(/\/api\/articles\?.*$/, async (route) => {
    const url = new URL(route.request().url())
    articleQueries.push(url)
    const articles = url.searchParams.has('favorited')
      ? [favoritedArticle]
      : [authoredArticle]

    await route.fulfill({
      json: { articles, articlesCount: articles.length },
    })
  })

  await page.goto('/profile/alice')

  await expect(page.locator('.profile-page')).toBeVisible()
  await expect(page.locator('.user-img')).toHaveAttribute(
    'src',
    /default-avatar\.svg$/,
  )
  await expect(
    page.getByRole('heading', { name: 'alice', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.profile-bio')).toHaveText(aliceProfile.bio)
  await expect(
    page.getByRole('heading', { name: authoredArticle.title }),
  ).toBeVisible()

  await page.getByRole('link', { name: 'Favorited Articles' }).click()

  await expect(page).toHaveURL('/profile/alice/favorites')
  await expect(
    page.getByRole('heading', { name: favoritedArticle.title }),
  ).toBeVisible()
  expect(
    articleQueries.some((url) => url.searchParams.get('author') === 'alice'),
  ).toBe(true)
  expect(
    articleQueries.some((url) => url.searchParams.get('favorited') === 'alice'),
  ).toBe(true)
})

test('follows and unfollows another user with the saved session', async ({
  page,
}) => {
  const methods: string[] = []
  const authorizations: Array<string | null> = []

  await mockSession(page)
  await page.route(/\/api\/profiles\/alice$/, async (route) => {
    await route.fulfill({ json: { profile: aliceProfile } })
  })
  await page.route(/\/api\/articles\?.*$/, async (route) => {
    await route.fulfill({ json: { articles: [], articlesCount: 0 } })
  })
  await page.route(/\/api\/profiles\/alice\/follow$/, async (route) => {
    const method = route.request().method()
    methods.push(method)
    authorizations.push(route.request().headers().authorization ?? null)
    await route.fulfill({
      json: {
        profile: {
          ...aliceProfile,
          following: method === 'POST',
        },
      },
    })
  })

  await page.goto('/profile/alice')

  await page.getByRole('button', { name: 'Follow alice' }).click()
  await expect(
    page.getByRole('button', { name: 'Unfollow alice' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Unfollow alice' }).click()
  await expect(page.getByRole('button', { name: 'Follow alice' })).toBeVisible()

  expect(methods).toEqual(['POST', 'DELETE'])
  expect(authorizations).toEqual([`Token ${token}`, `Token ${token}`])
})

test('recovers from a follow error and retries successfully', async ({
  page,
}) => {
  let followAttempts = 0

  await mockSession(page)
  await page.route(/\/api\/profiles\/alice$/, async (route) => {
    await route.fulfill({ json: { profile: aliceProfile } })
  })
  await page.route(/\/api\/articles\?.*$/, async (route) => {
    await route.fulfill({ json: { articles: [], articlesCount: 0 } })
  })
  await page.route(/\/api\/profiles\/alice\/follow$/, async (route) => {
    followAttempts += 1

    if (followAttempts === 1) {
      await route.fulfill({
        status: 503,
        json: { errors: { profile: ['temporarily unavailable'] } },
      })
      return
    }

    await route.fulfill({
      json: {
        profile: {
          ...aliceProfile,
          following: true,
        },
      },
    })
  })

  await page.goto('/profile/alice')

  const followButton = page.getByRole('button', { name: 'Follow alice' })
  await expect(followButton).toBeVisible()
  await expect(followButton).toHaveAttribute('aria-pressed', 'false')

  await followButton.click()

  await expect(followButton).toBeVisible()
  await expect(followButton).toBeEnabled()
  await expect(followButton).toHaveAttribute('aria-pressed', 'false')
  await expect(followButton).not.toHaveClass(/active/)
  await expect(page.locator('.follow-error')).toHaveText(
    'Unable to update the follow status (HTTP 503).',
  )

  await followButton.click()

  const unfollowButton = page.getByRole('button', { name: 'Unfollow alice' })
  await expect(unfollowButton).toBeVisible()
  await expect(unfollowButton).toHaveAttribute('aria-pressed', 'true')
  await expect(unfollowButton).toHaveClass(/active/)
  await expect(page.locator('.follow-error')).toHaveCount(0)
  expect(followAttempts).toBe(2)
})

test('updates settings, rotates the token, and logs out', async ({ page }) => {
  const updatedUser = {
    ...reader,
    username: 'reader-updated',
    email: 'updated@example.com',
    bio: 'Updated bio',
    image: '',
    token: 'rotated-token',
  }
  let updateBody: unknown
  let updateAuthorization: string | null = null

  await page.addInitScript((savedToken) => {
    localStorage.setItem('jwtToken', savedToken)
  }, token)
  await page.route(/\/api\/user$/, async (route) => {
    if (route.request().method() === 'PUT') {
      updateBody = route.request().postDataJSON()
      updateAuthorization = route.request().headers().authorization ?? null
      await route.fulfill({ json: { user: updatedUser } })
      return
    }

    await route.fulfill({ json: { user: reader } })
  })
  await page.route(/\/api\/profiles\/reader-updated$/, async (route) => {
    await route.fulfill({
      json: {
        profile: {
          username: updatedUser.username,
          bio: updatedUser.bio,
          image: updatedUser.image,
          following: false,
        },
      },
    })
  })
  await page.route(/\/api\/articles\?.*$/, async (route) => {
    await route.fulfill({ json: { articles: [], articlesCount: 0 } })
  })
  await mockEmptyHome(page)

  await page.goto('/settings')
  await page.locator('input[name="image"]').fill('')
  await page.locator('input[name="username"]').fill(updatedUser.username)
  await page.locator('textarea[name="bio"]').fill(updatedUser.bio)
  await page.locator('input[name="email"]').fill(updatedUser.email)
  await page.locator('input[name="password"]').fill('')
  await page.getByRole('button', { name: 'Update Settings' }).click()

  await expect(page).toHaveURL(`/profile/${updatedUser.username}`)
  await expect(
    page.locator('nav .nav-link', { hasText: updatedUser.username }),
  ).toBeVisible()
  expect(updateBody).toEqual({
    user: {
      image: '',
      username: updatedUser.username,
      bio: updatedUser.bio,
      email: updatedUser.email,
    },
  })
  expect(updateAuthorization).toBe(`Token ${token}`)
  expect(await page.evaluate(() => localStorage.getItem('jwtToken'))).toBe(
    updatedUser.token,
  )
  await expect(page.locator('body')).not.toContainText(updatedUser.token)

  await page.getByRole('button', { name: 'Log out' }).click()

  await expect(page).toHaveURL('/')
  expect(await page.evaluate(() => localStorage.getItem('jwtToken'))).toBeNull()
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
})
