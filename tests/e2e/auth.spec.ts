import { expect, test, type Page } from '@playwright/test'

const alice = {
  username: 'alice',
  email: 'alice@example.com',
  bio: null,
  image: null,
  token: 'alice-token',
}

async function mockEmptyHome(page: Page): Promise<void> {
  await page.route(/\/api\/articles(?:\?.*)?$/, async (route) => {
    await route.fulfill({ json: { articles: [], articlesCount: 0 } })
  })
  await page.route(/\/api\/tags$/, async (route) => {
    await route.fulfill({ json: { tags: [] } })
  })
}

test('logs in, stores the token, and returns to the protected route', async ({
  page,
}) => {
  let requestBody: unknown

  await page.route(/\/api\/users\/login$/, async (route) => {
    requestBody = route.request().postDataJSON()
    await route.fulfill({ json: { user: alice } })
  })

  await page.goto('/login?redirect=/settings')
  await page.locator('input[name="email"]').fill(alice.email)
  await page.locator('input[name="password"]').fill('secret123')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page).toHaveURL('/settings')
  await expect(
    page.getByRole('heading', { name: 'Your Settings' }),
  ).toBeVisible()
  expect(requestBody).toEqual({
    user: { email: alice.email, password: 'secret123' },
  })
  expect(await page.evaluate(() => localStorage.getItem('jwtToken'))).toBe(
    alice.token,
  )
})

test('registers a user and exposes the authenticated navigation', async ({
  page,
}) => {
  const bob = {
    ...alice,
    username: 'bob',
    email: 'bob@example.com',
    token: 'bob-token',
  }
  let requestBody: unknown

  await mockEmptyHome(page)
  await page.route(/\/api\/users$/, async (route) => {
    requestBody = route.request().postDataJSON()
    await route.fulfill({ json: { user: bob } })
  })

  await page.goto('/register')
  await page.locator('input[name="username"]').fill(bob.username)
  await page.locator('input[name="email"]').fill(bob.email)
  await page.locator('input[name="password"]').fill('secret123')
  await page.getByRole('button', { name: 'Sign up' }).click()

  await expect(page).toHaveURL('/')
  await expect(
    page.locator('nav .nav-link', { hasText: bob.username }),
  ).toBeVisible()
  expect(requestBody).toEqual({
    user: {
      username: bob.username,
      email: bob.email,
      password: 'secret123',
    },
  })
  expect(await page.evaluate(() => localStorage.getItem('jwtToken'))).toBe(
    bob.token,
  )
})

test('restores a saved session before opening Settings', async ({ page }) => {
  const savedToken = 'saved-session-token'
  let authorization: string | null = null

  await page.addInitScript((token) => {
    localStorage.setItem('jwtToken', token)
  }, savedToken)
  await page.route(/\/api\/user$/, async (route) => {
    authorization = route.request().headers().authorization ?? null
    await route.fulfill({ json: { user: { ...alice, token: savedToken } } })
  })

  await page.goto('/settings')

  await expect(page).toHaveURL('/settings')
  await expect(
    page.getByRole('heading', { name: 'Your Settings' }),
  ).toBeVisible()
  await expect(page.locator('input[name="username"]')).toHaveValue(
    alice.username,
  )
  await expect(page.locator('input[name="email"]')).toHaveValue(alice.email)
  expect(authorization).toBe(`Token ${savedToken}`)
  await expect(page.locator('body')).not.toContainText(savedToken)
})
