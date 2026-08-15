import { expect, test } from '@playwright/test'

const token = 'debug-reader-token'
const user = {
  username: 'debug-reader',
  email: 'debug-reader@example.com',
  bio: 'Debug fixture user.',
  image: null,
  token,
}

test('exposes the auth debug contract without rendering the token', async ({
  page,
}) => {
  await page.addInitScript((savedToken) => {
    localStorage.setItem('jwtToken', savedToken)
  }, token)
  await page.route(/\/api\/user$/, async (route) => {
    await route.fulfill({ json: { user } })
  })
  await page.route(/\/api\/articles(?:\?.*)?$/, async (route) => {
    await route.fulfill({ json: { articles: [], articlesCount: 0 } })
  })
  await page.route(/\/api\/tags$/, async (route) => {
    await route.fulfill({ json: { tags: [] } })
  })

  await page.goto('/')

  await expect(
    page.locator('nav .nav-link', { hasText: user.username }),
  ).toBeVisible()
  await expect(page.locator('body')).not.toContainText(token)

  const debugState = await page.evaluate(() => ({
    authState: window.__conduit_debug__?.getAuthState(),
    currentUser: window.__conduit_debug__?.getCurrentUser(),
    token: window.__conduit_debug__?.getToken(),
  }))

  expect(debugState.authState).toBe('authenticated')
  expect(debugState.currentUser).toEqual(user)
  expect(debugState.token).toBe(token)
})
