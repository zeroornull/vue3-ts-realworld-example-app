import { expect, test, type Page } from '@playwright/test'

const token = 'writer-token'

const reader = {
  username: 'writer',
  email: 'writer@example.com',
  bio: 'Writes deterministic browser fixtures.',
  image: null,
  token,
}

const readerAuthor = {
  username: reader.username,
  bio: reader.bio,
  image: reader.image,
  following: false,
}

function createArticle(
  slug: string,
  title: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    slug,
    title,
    description: 'A deterministic article fixture.',
    body: '# Article lifecycle\n\nCreated for browser verification.',
    tagList: ['playwright', 'lifecycle'],
    createdAt: '2026-08-15T00:00:00.000Z',
    updatedAt: '2026-08-15T00:00:00.000Z',
    favorited: false,
    favoritesCount: 0,
    author: readerAuthor,
    ...overrides,
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

async function mockArticleRead(
  page: Page,
  article: ReturnType<typeof createArticle>,
): Promise<void> {
  await page.route(
    new RegExp(`/api/articles/${article.slug}$`),
    async (route) => {
      await route.fulfill({ json: { article } })
    },
  )
  await page.route(
    new RegExp(`/api/articles/${article.slug}/comments$`),
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

test('creates an article with the normalized draft and opens its detail page', async ({
  page,
}) => {
  const createdArticle = createArticle(
    'created-lifecycle-article',
    'Created lifecycle article',
    {
      description: 'Created from the article editor.',
      body: '# Created article\n\nThe editor submitted this Markdown.',
      tagList: ['vue', 'bun'],
    },
  )
  let requestBody: unknown
  let authorization: string | null = null

  await mockSession(page)
  await page.route(/\/api\/articles$/, async (route) => {
    requestBody = route.request().postDataJSON()
    authorization = route.request().headers().authorization ?? null
    await route.fulfill({ json: { article: createdArticle } })
  })
  await mockArticleRead(page, createdArticle)

  await page.goto('/editor')
  await page.locator('input[name="title"]').fill('Created lifecycle article')
  await page
    .locator('input[name="description"]')
    .fill('Created from the article editor.')
  await page
    .locator('textarea[name="body"]')
    .fill('# Created article\n\nThe editor submitted this Markdown.')
  await page.locator('input[placeholder="Enter tags"]').fill('vue, bun')
  await page.getByRole('button', { name: 'Publish Article' }).click()

  await expect(page).toHaveURL(`/article/${createdArticle.slug}`)
  await expect(
    page.getByRole('heading', { name: createdArticle.title }),
  ).toBeVisible()
  await expect(page.locator('.markdown-body')).toContainText(
    'The editor submitted this Markdown.',
  )
  expect(requestBody).toEqual({
    article: {
      title: createdArticle.title,
      description: createdArticle.description,
      body: createdArticle.body,
      tagList: createdArticle.tagList,
    },
  })
  expect(authorization).toBe(`Token ${token}`)
})

test('edits an article, replaces its tags, and opens the new slug', async ({
  page,
}) => {
  const originalArticle = createArticle('article-before-edit', 'Before edit', {
    description: 'Original description.',
    body: '# Before edit',
    tagList: ['old', 'keep'],
  })
  const updatedArticle = createArticle('article-after-edit', 'After edit', {
    description: 'Updated description.',
    body: '# After edit\n\nUpdated Markdown.',
    tagList: ['updated'],
  })
  let requestBody: unknown
  let authorization: string | null = null

  await mockSession(page)
  await mockArticleRead(page, originalArticle)
  await page.route(
    new RegExp(`/api/articles/${originalArticle.slug}$`),
    async (route) => {
      if (route.request().method() !== 'PUT') {
        await route.fallback()
        return
      }

      requestBody = route.request().postDataJSON()
      authorization = route.request().headers().authorization ?? null
      await route.fulfill({ json: { article: updatedArticle } })
    },
  )
  await mockArticleRead(page, updatedArticle)

  await page.goto(`/editor/${originalArticle.slug}`)
  await expect(page.locator('input[name="title"]')).toHaveValue(
    originalArticle.title,
  )
  await page.getByRole('button', { name: 'Remove old' }).click()
  await page.getByRole('button', { name: 'Remove keep' }).click()
  await page.locator('input[name="title"]').fill(updatedArticle.title)
  await page
    .locator('input[name="description"]')
    .fill(updatedArticle.description)
  await page.locator('textarea[name="body"]').fill(updatedArticle.body)
  await page.locator('input[placeholder="Enter tags"]').fill('updated')
  await page.getByRole('button', { name: 'Publish Article' }).click()

  await expect(page).toHaveURL(`/article/${updatedArticle.slug}`)
  await expect(
    page
      .locator('.article-banner')
      .getByRole('heading', { name: updatedArticle.title }),
  ).toBeVisible()
  expect(requestBody).toEqual({
    article: {
      title: updatedArticle.title,
      description: updatedArticle.description,
      body: updatedArticle.body,
      tagList: updatedArticle.tagList,
    },
  })
  expect(authorization).toBe(`Token ${token}`)
})

test('deletes an authored article and returns to the Global Feed', async ({
  page,
}) => {
  const article = createArticle('article-to-delete', 'Article to delete')
  let deleteAuthorization: string | null = null

  await mockSession(page)
  await mockArticleRead(page, article)
  await page.route(
    new RegExp(`/api/articles/${article.slug}$`),
    async (route) => {
      if (route.request().method() !== 'DELETE') {
        await route.fallback()
        return
      }

      deleteAuthorization = route.request().headers().authorization ?? null
      await route.fulfill({ status: 204, body: '' })
    },
  )
  await mockEmptyHome(page)

  await page.goto(`/article/${article.slug}`)
  await expect(page.getByRole('heading', { name: article.title })).toBeVisible()
  await page.getByRole('button', { name: 'Delete Article' }).first().click()

  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: 'conduit' })).toBeVisible()
  await expect(page.locator('body')).not.toContainText(article.title)
  expect(deleteAuthorization).toBe(`Token ${token}`)
})
