import { expect, test, type Page } from '@playwright/test'

const article = {
  slug: 'browser-security-article',
  title: 'Browser security article',
  description: 'A deterministic security fixture.',
  body: 'A safe body.',
  tagList: ['security'],
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

const readerToken = 'security-reader-token'

async function mockArticlePage(
  page: Page,
  articleFixture: typeof article,
  comments: unknown[] = [],
): Promise<void> {
  await page.route(
    new RegExp(`/api/articles/${articleFixture.slug}$`),
    async (route) => {
      await route.fulfill({ json: { article: articleFixture } })
    },
  )
  await page.route(
    new RegExp(`/api/articles/${articleFixture.slug}/comments$`),
    async (route) => {
      await route.fulfill({ json: { comments } })
    },
  )
}

test('removes scripts, event attributes, and dangerous Markdown URLs', async ({
  page,
}) => {
  const hostileArticle = {
    ...article,
    body: [
      '# Sanitized browser content',
      '<script>window.__xssTriggered = true</script>',
      '<img src="x" onerror="alert(1)">',
      '<svg onload="alert(2)"></svg>',
      '<div onclick="alert(3)">event text stays visible</div>',
      '[danger](javascript:alert(4))',
      '<a href="javascript:alert(5)">danger link</a>',
    ].join('\n\n'),
  }
  const dialogs: string[] = []

  page.on('dialog', async (dialog) => {
    dialogs.push(dialog.type())
    await dialog.dismiss()
  })
  await mockArticlePage(page, hostileArticle)

  await page.goto(`/article/${hostileArticle.slug}`)

  const markdown = page.locator('.markdown-body')
  await expect(markdown).toContainText('Sanitized browser content')
  await expect(markdown).toContainText('event text stays visible')
  await expect(markdown.locator('script')).toHaveCount(0)
  await expect(markdown.locator('[onerror], [onload], [onclick]')).toHaveCount(
    0,
  )
  await expect(markdown.locator('a[href^="javascript:"]')).toHaveCount(0)
  expect(dialogs).toEqual([])
})

test('keeps external Markdown links safe and same-origin links local', async ({
  page,
}) => {
  const linkedArticle = {
    ...article,
    body: [
      '[external guide](https://example.com/guide)',
      '[internal article](/article/local)',
    ].join('\n\n'),
  }
  await mockArticlePage(page, linkedArticle)

  await page.goto(`/article/${linkedArticle.slug}`)

  const external = page.getByRole('link', { name: 'external guide' })
  const internal = page.getByRole('link', { name: 'internal article' })
  await expect(external).toHaveAttribute('target', '_blank')
  await expect(external).toHaveAttribute('rel', 'noopener noreferrer')
  await expect(internal).not.toHaveAttribute('target')
  await expect(internal).not.toHaveAttribute('rel')
})

test('keeps malicious image URLs as attributes, never executable handlers', async ({
  page,
}) => {
  const maliciousImage = 'https://example.com/avatar.jpg" onerror="alert(1)'
  const maliciousAuthor = {
    ...article.author,
    image: maliciousImage,
  }
  const authenticatedArticle = {
    ...article,
    author: maliciousAuthor,
  }
  const reader = {
    username: 'reader',
    email: 'reader@example.com',
    bio: null,
    image: maliciousImage,
    token: readerToken,
  }
  const comment = {
    id: 1,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    body: 'A comment with a hostile avatar URL.',
    author: maliciousAuthor,
  }
  const dialogs: string[] = []

  page.on('dialog', async (dialog) => {
    dialogs.push(dialog.type())
    await dialog.dismiss()
  })
  await page.addInitScript((token) => {
    localStorage.setItem('jwtToken', token)
  }, readerToken)
  await page.route(/\/api\/user$/, async (route) => {
    await route.fulfill({ json: { user: reader } })
  })
  await mockArticlePage(page, authenticatedArticle, [comment])

  await page.goto(`/article/${authenticatedArticle.slug}`)

  const images = page.locator('img')
  await expect(images).not.toHaveCount(0)
  await expect(page.locator('img[onerror], img[onload]')).toHaveCount(0)
  expect(
    await images.evaluateAll((elements) =>
      elements.every(
        (element) =>
          !element.hasAttribute('onerror') && !element.hasAttribute('onload'),
      ),
    ),
  ).toBe(true)
  expect(dialogs).toEqual([])
})
