import { expect, test, type Page } from '@playwright/test'

const slug = 'playwright-article'
const token = 'reader-token'

const author = {
  username: 'alice',
  bio: 'Writes deterministic browser fixtures.',
  image: null,
  following: false,
}

const reader = {
  username: 'reader',
  email: 'reader@example.com',
  bio: null,
  image: null,
  token,
}

const article = {
  slug,
  title: 'Article interactions in Playwright',
  description: 'A stable detail fixture.',
  body: '# Browser verified\n\nComments and favorites stay deterministic.',
  tagList: ['playwright', 'article'],
  createdAt: '2026-08-15T00:00:00.000Z',
  updatedAt: '2026-08-15T00:00:00.000Z',
  favorited: false,
  favoritesCount: 0,
  author,
}

const existingComment = {
  id: 1,
  createdAt: '2026-08-15T00:00:00.000Z',
  updatedAt: '2026-08-15T00:00:00.000Z',
  body: 'An existing comment.',
  author,
}

async function mockSession(page: Page): Promise<void> {
  await page.addInitScript((savedToken) => {
    localStorage.setItem('jwtToken', savedToken)
  }, token)
  await page.route(/\/api\/user$/, async (route) => {
    await route.fulfill({ json: { user: reader } })
  })
}

async function mockArticleRead(
  page: Page,
  comments = [existingComment],
): Promise<void> {
  await page.route(new RegExp(`/api/articles/${slug}$`), async (route) => {
    await route.fulfill({ json: { article } })
  })
  await page.route(
    new RegExp(`/api/articles/${slug}/comments$`),
    async (route) => {
      await route.fulfill({ json: { comments } })
    },
  )
}

test('renders article Markdown, tags, comments, and default avatars', async ({
  page,
}) => {
  await mockArticleRead(page)

  await page.goto(`/article/${slug}`)

  await expect(page.getByRole('heading', { name: article.title })).toBeVisible()
  await expect(page.locator('.article-content')).toContainText(
    'Comments and favorites stay deterministic.',
  )
  await expect(page.locator('.article-content .tag-default')).toHaveCount(2)
  await expect(page.locator('.article-meta img').first()).toHaveAttribute(
    'src',
    /default-avatar\.svg$/,
  )
  await expect(
    page.locator('.card:not(.comment-form)', {
      hasText: existingComment.body,
    }),
  ).toBeVisible()
  await expect(
    page
      .getByRole('region', { name: 'Comments' })
      .getByRole('link', { name: 'Sign in' }),
  ).toHaveAttribute('href', `/login?redirect=/article/${slug}`)
})

test('posts and deletes the current user comment', async ({ page }) => {
  const commentBody = 'A new comment from Playwright.'
  const createdComment = {
    ...existingComment,
    id: 42,
    body: commentBody,
    author: {
      username: reader.username,
      bio: reader.bio,
      image: reader.image,
      following: false,
    },
  }
  let createBody: unknown
  let deleteAuthorization: string | null = null

  await mockSession(page)
  await mockArticleRead(page)
  await page.route(
    new RegExp(`/api/articles/${slug}/comments$`),
    async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback()
        return
      }

      createBody = route.request().postDataJSON()
      await route.fulfill({ json: { comment: createdComment } })
    },
  )
  await page.route(
    new RegExp(`/api/articles/${slug}/comments/42$`),
    async (route) => {
      deleteAuthorization = route.request().headers().authorization ?? null
      await route.fulfill({ status: 204, body: '' })
    },
  )

  await page.goto(`/article/${slug}`)
  await page
    .locator('textarea[placeholder="Write a comment..."]')
    .fill(commentBody)
  await page.getByRole('button', { name: 'Post Comment' }).click()

  const ownComment = page.locator('.card:not(.comment-form)', {
    hasText: commentBody,
  })
  await expect(ownComment).toBeVisible()
  expect(createBody).toEqual({ comment: { body: commentBody } })
  await ownComment.locator('i.ion-trash-a').click()

  await expect(ownComment).toHaveCount(0)
  expect(deleteAuthorization).toBe(`Token ${token}`)
})

test('keeps the comment draft and shows API field errors when posting fails', async ({
  page,
}) => {
  const commentBody = 'A comment that the API rejects.'
  let createRequests = 0

  await mockSession(page)
  await mockArticleRead(page, [])
  await page.route(
    new RegExp(`/api/articles/${slug}/comments$`),
    async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback()
        return
      }

      createRequests += 1
      await route.fulfill({
        status: 422,
        json: { errors: { body: ['is too short'] } },
      })
    },
  )

  await page.goto(`/article/${slug}`)
  const textarea = page.locator('textarea[placeholder="Write a comment..."]')
  await textarea.fill(commentBody)
  await page.getByRole('button', { name: 'Post Comment' }).click()

  await expect(page.locator('.comment-editor .error-messages')).toContainText(
    'body is too short',
  )
  await expect(textarea).toHaveValue(commentBody)
  await expect(page.locator('.comment-card')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Post Comment' })).toBeEnabled()
  expect(createRequests).toBe(1)
})

test('favorites and unfavorites an article with the RealWorld button states', async ({
  page,
}) => {
  const methods: string[] = []
  const authorizations: Array<string | null> = []

  await mockSession(page)
  await mockArticleRead(page, [])
  await page.route(
    new RegExp(`/api/articles/${slug}/favorite$`),
    async (route) => {
      const method = route.request().method()
      const favorited = method === 'POST'
      methods.push(method)
      authorizations.push(route.request().headers().authorization ?? null)
      await route.fulfill({
        json: {
          article: {
            ...article,
            favorited,
            favoritesCount: favorited ? 1 : 0,
          },
        },
      })
    },
  )

  await page.goto(`/article/${slug}`)

  await page
    .getByRole('button', { name: /^Favorite/ })
    .first()
    .click()
  await expect(page.getByRole('button', { name: /^Unfavorite/ })).toHaveCount(2)
  await expect(page.locator('button.btn-primary')).toHaveCount(2)

  await page
    .getByRole('button', { name: /^Unfavorite/ })
    .first()
    .click()
  await expect(page.getByRole('button', { name: /^Favorite/ })).toHaveCount(2)
  await expect(page.locator('button.btn-outline-primary')).toHaveCount(2)

  expect(methods).toEqual(['POST', 'DELETE'])
  expect(authorizations).toEqual([`Token ${token}`, `Token ${token}`])
})

test('keeps favorite state unchanged and recovers after a favorite API error', async ({
  page,
}) => {
  let favoriteRequests = 0

  await mockSession(page)
  await mockArticleRead(page, [])
  await page.route(
    new RegExp(`/api/articles/${slug}/favorite$`),
    async (route) => {
      favoriteRequests += 1

      if (favoriteRequests === 1) {
        await route.fulfill({
          status: 503,
          json: { errors: { favorite: ['temporarily unavailable'] } },
        })
        return
      }

      await route.fulfill({
        json: {
          article: {
            ...article,
            favorited: true,
            favoritesCount: 1,
          },
        },
      })
    },
  )

  await page.goto(`/article/${slug}`)
  const favoriteButtons = page.getByRole('button', { name: /^Favorite/ })
  await favoriteButtons.first().click()

  await expect(
    page.locator('.article-actions').first().getByRole('alert'),
  ).toContainText('favorite temporarily unavailable')
  await expect(favoriteButtons).toHaveCount(2)
  await expect(page.locator('button.btn-outline-primary')).toHaveCount(2)

  await favoriteButtons.first().click()

  await expect(page.getByRole('button', { name: /^Unfavorite/ })).toHaveCount(2)
  await expect(page.locator('button.btn-primary')).toHaveCount(2)
  await expect(
    page.locator('.article-actions').first().getByRole('alert'),
  ).toHaveCount(0)
  expect(favoriteRequests).toBe(2)
})
