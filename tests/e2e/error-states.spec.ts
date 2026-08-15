import { expect, test, type Page } from '@playwright/test'

const savedToken = 'invalid-session-token'

const article = {
  slug: 'recoverable-article',
  title: 'Recoverable article',
  description: 'An article that becomes available after a retry.',
  body: 'The retry path keeps the page recoverable.',
  tagList: ['errors', 'playwright'],
  createdAt: '2026-08-15T00:00:00.000Z',
  updatedAt: '2026-08-15T00:00:00.000Z',
  favorited: false,
  favoritesCount: 0,
  author: {
    username: 'alice',
    bio: null,
    image: null,
    following: false,
  },
}

async function mockEmptyComments(page: Page, slug: string): Promise<void> {
  await page.route(
    new RegExp(`/api/articles/${slug}/comments$`),
    async (route) => {
      await route.fulfill({ json: { comments: [] } })
    },
  )
}

async function mockEmptyHome(page: Page): Promise<void> {
  await page.route(/\/api\/articles(?:\?.*)?$/, async (route) => {
    await route.fulfill({ json: { articles: [], articlesCount: 0 } })
  })
  await page.route(/\/api\/tags$/, async (route) => {
    await route.fulfill({ json: { tags: [] } })
  })
}

test('clears an expired session when initialization returns a 4xx', async ({
  page,
}) => {
  const token = 'expired-session-token'

  await page.addInitScript((savedToken) => {
    localStorage.setItem('jwtToken', savedToken)
  }, token)
  await page.route(/\/api\/user$/, async (route) => {
    await route.fulfill({
      status: 401,
      json: { errors: { token: ['expired'] } },
    })
  })
  await mockEmptyHome(page)

  await page.goto('/')

  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('jwtToken'))).toBeNull()
})

test('keeps a session and exposes unavailable state for an initialization 5xx', async ({
  page,
}) => {
  const token = 'temporarily-unavailable-token'

  await page.addInitScript((savedToken) => {
    localStorage.setItem('jwtToken', savedToken)
  }, token)
  await page.route(/\/api\/user$/, async (route) => {
    await route.fulfill({
      status: 503,
      json: { errors: { service: ['temporarily unavailable'] } },
    })
  })
  await mockEmptyHome(page)

  await page.goto('/')

  await expect(page.getByText('Session unavailable')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('jwtToken'))).toBe(
    token,
  )
})

test('keeps a session and exposes unavailable state for an initialization network error', async ({
  page,
}) => {
  const token = 'offline-session-token'

  await page.addInitScript((savedToken) => {
    localStorage.setItem('jwtToken', savedToken)
  }, token)
  await page.route(/\/api\/user$/, async (route) => {
    await route.abort('failed')
  })
  await mockEmptyHome(page)

  await page.goto('/')

  await expect(page.getByText('Session unavailable')).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('jwtToken'))).toBe(
    token,
  )
})

test('keeps a session and exposes unavailable state for a malformed 2xx user payload', async ({
  page,
}) => {
  const token = 'malformed-user-payload-token'

  await page.addInitScript((savedToken) => {
    localStorage.setItem('jwtToken', savedToken)
  }, token)
  await page.route(/\/api\/user$/, async (route) => {
    await route.fulfill({
      status: 200,
      json: { user: { username: 'missing-required-fields' } },
    })
  })
  await mockEmptyHome(page)

  await page.goto('/')

  await expect(page.getByText('Session unavailable')).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('jwtToken'))).toBe(
    token,
  )
})

test('keeps a session and exposes unavailable state for malformed 2xx JSON', async ({
  page,
}) => {
  const token = 'malformed-user-json-token'

  await page.addInitScript((savedToken) => {
    localStorage.setItem('jwtToken', savedToken)
  }, token)
  await page.route(/\/api\/user$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"user":',
    })
  })
  await mockEmptyHome(page)

  await page.goto('/')

  await expect(page.getByText('Session unavailable')).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('jwtToken'))).toBe(
    token,
  )
})

test('shows API field errors when login is rejected', async ({ page }) => {
  await page.route(/\/api\/users\/login$/, async (route) => {
    await route.fulfill({
      status: 422,
      json: {
        errors: {
          email: ['is invalid'],
          password: ['is too short'],
        },
      },
    })
  })

  await page.goto('/login')
  await page.locator('input[name="email"]').fill('invalid@example.com')
  await page.locator('input[name="password"]').fill('bad')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page).toHaveURL('/login')
  await expect(page.locator('.error-messages')).toContainText(
    'email is invalid',
  )
  await expect(page.locator('.error-messages')).toContainText(
    'password is too short',
  )
  expect(await page.evaluate(() => localStorage.getItem('jwtToken'))).toBeNull()
})

test('clears an invalid saved token before redirecting to login', async ({
  page,
}) => {
  await page.addInitScript((token) => {
    localStorage.setItem('jwtToken', token)
  }, savedToken)
  await page.route(/\/api\/user$/, async (route) => {
    await route.fulfill({
      status: 401,
      json: { errors: { token: ['invalid'] } },
    })
  })

  await page.goto('/settings')

  await expect(page).toHaveURL(/\/login\?redirect=/)
  expect(new URL(page.url()).searchParams.get('redirect')).toBe('/settings')
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('jwtToken'))).toBeNull()
})

test('renders a profile 404 after bounded retries as a visible error state', async ({
  page,
}) => {
  let profileRequests = 0

  await page.route(/\/api\/profiles\/missing-user$/, async (route) => {
    profileRequests += 1
    await route.fulfill({
      status: 404,
      json: { errors: { profile: ['not found'] } },
    })
  })
  await page.route(/\/api\/articles\?.*$/, async (route) => {
    await route.fulfill({ json: { articles: [], articlesCount: 0 } })
  })

  await page.goto('/profile/missing-user')

  await expect(
    page.getByRole('heading', { name: 'Profile unavailable' }),
  ).toBeVisible()
  await expect(page.locator('[role="alert"]')).toContainText(
    'Profile not found.',
  )
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  expect(profileRequests).toBe(3)
})

test('renders an article 404 without exposing the API error payload', async ({
  page,
}) => {
  await page.route(/\/api\/articles\/missing-article$/, async (route) => {
    await route.fulfill({
      status: 404,
      json: { errors: { article: ['private server detail'] } },
    })
  })
  await mockEmptyComments(page, 'missing-article')

  await page.goto('/article/missing-article')

  await expect(
    page.getByRole('heading', { name: 'Article unavailable' }),
  ).toBeVisible()
  await expect(page.locator('.article-state')).toContainText(
    'Article not found.',
  )
  await expect(page.locator('.article-state')).not.toContainText(
    'private server detail',
  )
  await expect(
    page.getByRole('link', { name: 'Back to Global Feed' }),
  ).toBeVisible()
})

test('recovers an article after a temporary 5xx response', async ({ page }) => {
  let articleRequests = 0

  await page.route(/\/api\/articles\/recoverable-article$/, async (route) => {
    articleRequests += 1

    if (articleRequests === 1) {
      await route.fulfill({
        status: 503,
        json: { errors: { article: ['temporarily unavailable'] } },
      })
      return
    }

    await route.fulfill({ json: { article } })
  })
  await mockEmptyComments(page, article.slug)

  await page.goto(`/article/${article.slug}`)

  await expect(
    page.getByRole('heading', { name: 'Article unavailable' }),
  ).toBeVisible()
  await expect(page.locator('.article-state')).toContainText(
    'Unable to load the article (HTTP 503).',
  )

  await page.getByRole('button', { name: 'Try again' }).click()

  await expect(page.getByRole('heading', { name: article.title })).toBeVisible()
  await expect(page.locator('.markdown-body')).toContainText(
    'retry path keeps the page recoverable',
  )
  expect(articleRequests).toBe(2)
})
