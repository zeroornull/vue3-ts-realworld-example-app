import { expect, test, type Page } from '@playwright/test'

const token = 'feed-token'

const reader = {
  username: 'reader',
  email: 'reader@example.com',
  bio: null,
  image: null,
  token,
}

const author = {
  username: 'alice',
  bio: 'Writes deterministic browser fixtures.',
  image: null,
  following: false,
}

function createArticle(slug: string, title: string, tagList = ['vue']) {
  return {
    slug,
    title,
    description: `${title} description.`,
    body: `# ${title}`,
    tagList,
    createdAt: '2026-08-15T00:00:00.000Z',
    updatedAt: '2026-08-15T00:00:00.000Z',
    favorited: false,
    favoritesCount: 0,
    author,
  }
}

async function mockTags(page: Page): Promise<void> {
  await page.route(/\/api\/tags$/, async (route) => {
    await route.fulfill({ json: { tags: ['vue', 'bun', 'playwright'] } })
  })
}

async function mockSession(page: Page): Promise<void> {
  await page.addInitScript((savedToken) => {
    localStorage.setItem('jwtToken', savedToken)
  }, token)
  await page.route(/\/api\/user$/, async (route) => {
    await route.fulfill({ json: { user: reader } })
  })
}

test('filters a tag route and sends the tag query to the Global Feed', async ({
  page,
}) => {
  const taggedArticle = createArticle('vue-tag-article', 'Vue tag article', [
    'vue',
    'typescript',
  ])
  let requestUrl: URL | null = null

  await mockTags(page)
  await page.route(/\/api\/articles(?:\?.*)?$/, async (route) => {
    requestUrl = new URL(route.request().url())
    await route.fulfill({
      json: { articles: [taggedArticle], articlesCount: 1 },
    })
  })

  await page.goto('/tag/vue')

  await expect(page).toHaveURL('/tag/vue')
  await expect(page.locator('.feed-toggle')).toContainText('# vue')
  await expect(
    page.getByRole('heading', { name: taggedArticle.title }),
  ).toBeVisible()
  expect(requestUrl?.searchParams.get('tag')).toBe('vue')
  expect(requestUrl?.searchParams.get('limit')).toBe('10')
  expect(requestUrl?.searchParams.get('offset')).toBe('0')
})

test('restores Your Feed from the URL and preserves authentication', async ({
  page,
}) => {
  const followingArticle = createArticle(
    'following-article',
    'Following feed article',
    ['bun'],
  )
  let feedRequestUrl: URL | null = null
  let feedAuthorization: string | null = null

  await mockSession(page)
  await mockTags(page)
  await page.route(/\/api\/articles\/feed(?:\?.*)?$/, async (route) => {
    feedRequestUrl = new URL(route.request().url())
    feedAuthorization = route.request().headers().authorization ?? null
    await route.fulfill({
      json: { articles: [followingArticle], articlesCount: 1 },
    })
  })

  await page.goto('/?feed=following')

  await expect(page).toHaveURL('/?feed=following')
  await expect(page.getByRole('link', { name: 'Your Feed' })).toHaveClass(
    /active/,
  )
  await expect(
    page.getByRole('heading', { name: followingArticle.title }),
  ).toBeVisible()
  expect(feedRequestUrl?.pathname).toMatch(/\/api\/articles\/feed$/)
  expect(feedRequestUrl?.searchParams.get('limit')).toBe('10')
  expect(feedRequestUrl?.searchParams.get('offset')).toBe('0')
  expect(feedAuthorization).toBe(`Token ${token}`)
})

test('loads a paginated feed and keeps the URL in sync when changing pages', async ({
  page,
}) => {
  const firstPageArticle = createArticle('page-one', 'Page one article')
  const secondPageArticle = createArticle('page-two', 'Page two article')
  const offsets: string[] = []

  await mockTags(page)
  await page.route(/\/api\/articles(?:\?.*)?$/, async (route) => {
    const url = new URL(route.request().url())
    const offset = url.searchParams.get('offset') ?? ''
    offsets.push(offset)
    const article = offset === '10' ? secondPageArticle : firstPageArticle

    await route.fulfill({
      json: { articles: [article], articlesCount: 21 },
    })
  })

  await page.goto('/?page=2')

  await expect(page).toHaveURL('/?page=2')
  await expect(
    page.getByRole('heading', { name: secondPageArticle.title }),
  ).toBeVisible()
  await expect(page.locator('.page-item.active .page-link')).toHaveText('2')
  expect(offsets).toContain('10')

  await page.locator('.pagination .page-link', { hasText: '1' }).click()

  await expect(page).toHaveURL('/')
  await expect(
    page.getByRole('heading', { name: firstPageArticle.title }),
  ).toBeVisible()
  await expect(page.locator('.page-item.active .page-link')).toHaveText('1')
  expect(offsets).toContain('0')
})
