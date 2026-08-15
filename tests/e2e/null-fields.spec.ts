import { expect, test, type Page } from '@playwright/test'

const token = 'null-fields-token'

const reader = {
  username: 'reader',
  email: 'reader@example.com',
  bio: null,
  image: null,
  token,
}

const alice = {
  username: 'alice',
  bio: null,
  image: null,
  following: false,
}

function createArticle(slug: string, title: string) {
  return {
    slug,
    title,
    description: 'A null-field article fixture.',
    body: '# Null fields\n\nAvatar fallbacks stay visible.',
    tagList: ['null-fields'],
    createdAt: '2026-08-15T00:00:00.000Z',
    updatedAt: '2026-08-15T00:00:00.000Z',
    favorited: false,
    favoritesCount: 0,
    author: alice,
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

test('renders default avatar and a friendly bio for null profile fields', async ({
  page,
}) => {
  const article = createArticle('null-profile-article', 'Null profile article')

  await page.route(/\/api\/profiles\/alice$/, async (route) => {
    await route.fulfill({ json: { profile: alice } })
  })
  await page.route(/\/api\/articles\?.*$/, async (route) => {
    await route.fulfill({ json: { articles: [article], articlesCount: 1 } })
  })

  await page.goto('/profile/alice')

  await expect(page.locator('.user-img')).toHaveAttribute(
    'src',
    /default-avatar\.svg$/,
  )
  await expect(page.locator('.profile-bio')).toHaveText(
    'This user has not added a bio yet.',
  )
  await expect(page.locator('.article-meta img').first()).toHaveAttribute(
    'src',
    /default-avatar\.svg$/,
  )
})

test('keeps null avatars safe across authenticated navigation and comments', async ({
  page,
}) => {
  const article = createArticle('null-article', 'Null avatar article')
  const comment = {
    id: 7,
    createdAt: '2026-08-15T00:00:00.000Z',
    updatedAt: '2026-08-15T00:00:00.000Z',
    body: 'A comment with a null avatar.',
    author: alice,
  }

  await mockSession(page)
  await page.route(
    new RegExp(`/api/articles/${article.slug}$`),
    async (route) => {
      await route.fulfill({ json: { article } })
    },
  )
  await page.route(
    new RegExp(`/api/articles/${article.slug}/comments$`),
    async (route) => {
      await route.fulfill({ json: { comments: [comment] } })
    },
  )

  await page.goto(`/article/${article.slug}`)

  await expect(page.locator('.user-pic')).toHaveAttribute(
    'src',
    /default-avatar\.svg$/,
  )
  await expect(page.locator('.article-meta img')).toHaveCount(2)
  await expect(page.locator('.article-meta img').first()).toHaveAttribute(
    'src',
    /default-avatar\.svg$/,
  )
  await expect(
    page.locator('.comment-editor .comment-author-img'),
  ).toHaveAttribute('src', /default-avatar\.svg$/)
  await expect(
    page.locator('.comment-card .comment-author-img'),
  ).toHaveAttribute('src', /default-avatar\.svg$/)
})

test('initializes Settings null image and bio fields as empty strings', async ({
  page,
}) => {
  await mockSession(page)

  await page.goto('/settings')

  await expect(page.locator('input[name="image"]')).toHaveValue('')
  await expect(page.locator('textarea[name="bio"]')).toHaveValue('')
})

test('falls back to the default avatar when a profile image request fails', async ({
  page,
}) => {
  const brokenAvatar = 'https://cdn.example.test/broken-avatar.png'
  const profile = {
    ...alice,
    image: brokenAvatar,
  }

  await page.route(/\/api\/profiles\/alice$/, async (route) => {
    await route.fulfill({ json: { profile } })
  })
  await page.route(/\/api\/articles\?.*$/, async (route) => {
    await route.fulfill({ json: { articles: [], articlesCount: 0 } })
  })
  await page.route(brokenAvatar, async (route) => {
    await route.abort('failed')
  })

  await page.goto('/profile/alice')

  await expect(page.locator('.user-img')).toHaveAttribute(
    'src',
    /default-avatar\.svg$/,
  )
})
