import { expect, test, type Page } from '@playwright/test'

const retryArticle = {
  slug: 'network-retry-article',
  title: 'Network retry article',
  description: 'A deterministic article for retry coverage.',
  body: 'The network retry path recovers cleanly.',
  tagList: ['errors', 'network'],
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

const validArticle = {
  ...retryArticle,
  slug: 'malformed-comments-article',
  title: 'Malformed comments article',
  body: 'The article itself remains available.',
}

async function mockEmptyTags(page: Page): Promise<void> {
  await page.route(/\/api\/tags$/, async (route) => {
    await route.fulfill({ json: { tags: [] } })
  })
}

async function mockEmptyComments(page: Page, slug: string): Promise<void> {
  await page.route(
    new RegExp(`/api/articles/${slug}/comments$`),
    async (route) => {
      await route.fulfill({ json: { comments: [] } })
    },
  )
}

test('shows a connectivity error and recovers the Global Feed after retry', async ({
  page,
}) => {
  let articleRequests = 0

  await page.route(/\/api\/articles(?:\?.*)?$/, async (route) => {
    articleRequests += 1

    if (articleRequests === 1) {
      await route.abort('failed')
      return
    }

    await route.fulfill({
      json: { articles: [retryArticle], articlesCount: 1 },
    })
  })
  await mockEmptyTags(page)

  await page.goto('/')

  await expect(page.locator('.feed-error')).toContainText(
    'Unable to connect to the article service.',
  )
  await page.getByRole('button', { name: 'Try again' }).click()

  await expect(
    page.getByRole('heading', { name: retryArticle.title }),
  ).toBeVisible()
  expect(articleRequests).toBe(2)
})

test('turns a malformed article response into a recoverable error state', async ({
  page,
}) => {
  await page.route(/\/api\/articles\/malformed-article$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"article":',
    })
  })
  await mockEmptyComments(page, 'malformed-article')

  await page.goto('/article/malformed-article')

  await expect(
    page.getByRole('heading', { name: 'Article unavailable' }),
  ).toBeVisible()
  await expect(page.locator('.article-state')).toContainText(
    'The article service returned an invalid response.',
  )
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
})

test('keeps an article visible while malformed comments show a retry state', async ({
  page,
}) => {
  let commentRequests = 0

  await page.route(
    /\/api\/articles\/malformed-comments-article$/,
    async (route) => {
      await route.fulfill({ json: { article: validArticle } })
    },
  )
  await page.route(
    /\/api\/articles\/malformed-comments-article\/comments$/,
    async (route) => {
      commentRequests += 1

      if (commentRequests === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '{"comments":',
        })
        return
      }

      await route.fulfill({ json: { comments: [] } })
    },
  )

  await page.goto(`/article/${validArticle.slug}`)

  await expect(
    page.getByRole('heading', { name: validArticle.title }),
  ).toBeVisible()
  await expect(page.locator('.comments-error')).toContainText(
    'The comments service returned an invalid response.',
  )

  await page
    .locator('.comments-error')
    .getByRole('button', { name: 'Try again' })
    .click()

  await expect(page.locator('.comments-message')).toContainText(
    'No comments yet.',
  )
  expect(commentRequests).toBe(2)
})

test('shows an invalid-response error when login returns an empty 2xx body', async ({
  page,
}) => {
  await page.route(/\/api\/users\/login$/, async (route) => {
    await route.fulfill({ status: 204, body: '' })
  })

  await page.goto('/login')
  await page.locator('input[name="email"]').fill('empty@example.com')
  await page.locator('input[name="password"]').fill('secret123')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.locator('.error-messages')).toContainText(
    'server returned an invalid response',
  )
  await expect(page).toHaveURL('/login')
  expect(await page.evaluate(() => localStorage.getItem('jwtToken'))).toBeNull()
})
