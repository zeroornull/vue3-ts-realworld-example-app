import { expect, test, type Page } from '@playwright/test'

const profile = {
  username: 'alice',
  bio: null,
  image: null,
  following: false,
}

const article = {
  slug: 'playwright-smoke',
  title: 'Playwright smoke article',
  description: 'A deterministic article for the first browser test.',
  body: 'The browser smoke is isolated from the public API.',
  tagList: ['playwright', 'vue3'],
  createdAt: '2026-08-14T00:00:00.000Z',
  updatedAt: '2026-08-14T00:00:00.000Z',
  favorited: false,
  favoritesCount: 0,
  author: profile,
}

async function mockHomeApi(page: Page): Promise<void> {
  await page.route(/\/api\/articles(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      json: { articles: [article], articlesCount: 1 },
    })
  })

  await page.route(/\/api\/tags$/, async (route) => {
    await route.fulfill({ json: { tags: ['playwright', 'vue3'] } })
  })
}

test('loads the Conduit home with RealWorld selectors', async ({ page }) => {
  await mockHomeApi(page)
  await page.goto('/')

  await expect(page).toHaveTitle('Conduit')
  await expect(page.locator('.navbar')).toBeVisible()
  await expect(page.locator('.banner')).toContainText('conduit')
  await expect(page.locator('.feed-toggle')).toContainText('Global Feed')
  await expect(page.locator('.sidebar')).toContainText('Popular Tags')

  const preview = page.locator('.article-preview')
  await expect(preview).toContainText(article.title)
  await expect(preview.locator('.article-meta img')).toHaveAttribute(
    'src',
    /default-avatar\.svg$/,
  )
  await expect(preview.locator('.tag-default')).toHaveCount(2)
})

test('opens and refreshes the login route', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()

  const response = await page.reload()

  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})

test('redirects an unauthenticated Settings visit to login', async ({
  page,
}) => {
  await page.goto('/settings')

  await expect(page).toHaveURL(/\/login\?redirect=/)
  expect(new URL(page.url()).searchParams.get('redirect')).toBe('/settings')
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})
