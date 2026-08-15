import { expect, test } from 'bun:test'

const root = new URL('../', import.meta.url)

async function read(relativePath: string): Promise<string> {
  return Bun.file(new URL(relativePath, root)).text()
}

async function readSources(relativePaths: string[]): Promise<string> {
  return (await Promise.all(relativePaths.map(read))).join('\n')
}

test('pins the shared RealWorld theme and selector contract', async () => {
  const [gitmodules, selectors, theme] = await Promise.all([
    read('.gitmodules'),
    read('realworld/specs/e2e/SELECTORS.md'),
    read('realworld/assets/theme/styles.css'),
  ])

  expect(gitmodules).toContain(
    'url = https://github.com/realworld-apps/realworld',
  )
  expect(selectors).toContain('# RealWorld E2E Test Selectors Contract')
  expect(theme).toContain('Conduit Minimal CSS')
})

test('keeps upstream E2E discovery separate from the runnable local suite', async () => {
  const [packageJson, officialConfig] = await Promise.all([
    read('package.json'),
    read('playwright.official.config.ts'),
  ])

  expect(packageJson).toContain(
    '"test:e2e:official:list": "bunx playwright test --config playwright.official.config.ts --list"',
  )
  expect(officialConfig).toContain("testDir: './realworld/specs/e2e'")
  expect(officialConfig).toContain(
    "globalSetup: './scripts/official-security-gate.ts'",
  )
  expect(officialConfig).toContain('VITE_API_URL="${API_BASE:-')
  expect(officialConfig).toContain('webServer:')
  expect(officialConfig).toContain('127.0.0.1:4173')
})

test('exposes the Conduit document metadata and static assets', async () => {
  const document = await read('index.html')

  expect(document).toContain('href="/favicon.ico"')
  expect(document).toContain('rel="manifest" href="/manifest.json"')
  expect(document).toContain('<title>Conduit</title>')

  for (const asset of [
    'public/default-avatar.svg',
    'public/favicon.ico',
    'public/manifest.json',
    'public/robots.txt',
  ]) {
    expect(await Bun.file(new URL(asset, root)).exists()).toBe(true)
  }
})

test('loads the shared theme before local application styles', async () => {
  const main = await read('src/main.ts')
  const themeImport = "import '../realworld/assets/theme/styles.css'"
  const localImport = "import './style.scss'"

  expect(main).toContain(themeImport)
  expect(main.indexOf(themeImport)).toBeLessThan(main.indexOf(localImport))
})

test('keeps the RealWorld layout, feed, comment, and profile selectors', async () => {
  const sources = await readSources([
    'src/App.vue',
    'src/components/ArticleList.vue',
    'src/components/ArticleMeta.vue',
    'src/components/ArticlePreview.vue',
    'src/components/Comment.vue',
    'src/components/CommentEditor.vue',
    'src/components/ListErrors.vue',
    'src/components/VPagination.vue',
    'src/components/VTag.vue',
    'src/views/Article.vue',
    'src/views/Home.vue',
    'src/views/Profile.vue',
  ])

  for (const className of [
    'navbar',
    'navbar-brand',
    'nav-link',
    'banner',
    'container',
    'feed-toggle',
    'article-preview',
    'article-meta',
    'article-content',
    'article-page',
    'preview-link',
    'author',
    'empty-feed-message',
    'sidebar',
    'tag-list',
    'tag-default',
    'tag-pill',
    'card',
    'card-block',
    'comment-form',
    'comment-author-img',
    'mod-options',
    'ion-trash-a',
    'profile-page',
    'user-info',
    'user-img',
    'user-pic',
    'pagination',
    'page-item',
    'error-messages',
  ]) {
    expect(sources).toContain(className)
  }
})

test('keeps the RealWorld form and visible-text selectors', async () => {
  const sources = await readSources([
    'src/App.vue',
    'src/components/ArticleActions.vue',
    'src/components/CommentEditor.vue',
    'src/views/ArticleEdit.vue',
    'src/views/Home.vue',
    'src/views/Login.vue',
    'src/views/Profile.vue',
    'src/views/Register.vue',
    'src/views/Settings.vue',
  ])

  for (const name of [
    'username',
    'email',
    'password',
    'title',
    'description',
    'body',
    'image',
    'bio',
  ]) {
    expect(sources).toContain(`name="${name}"`)
  }

  expect(sources).toContain('placeholder="Enter tags"')
  expect(sources).toContain('placeholder="Write a comment..."')

  for (const label of [
    'Home',
    'Global Feed',
    'Your Feed',
    'Sign in',
    'Sign up',
    'Publish Article',
    'Update Settings',
    'Post Comment',
    'Favorite',
    'Unfavorite',
    'Follow',
    'Unfollow',
  ]) {
    expect(sources).toContain(label)
  }
})

test('uses the default avatar and RealWorld button-state classes', async () => {
  const [
    app,
    articleMeta,
    comment,
    commentEditor,
    profile,
    tags,
    actions,
    settings,
  ] = await Promise.all(
    [
      'src/App.vue',
      'src/components/ArticleMeta.vue',
      'src/components/Comment.vue',
      'src/components/CommentEditor.vue',
      'src/views/Profile.vue',
      'src/components/VTag.vue',
      'src/components/ArticleActions.vue',
      'src/views/Settings.vue',
    ].map(read),
  )

  for (const avatarSource of [
    app,
    articleMeta,
    comment,
    commentEditor,
    profile,
  ]) {
    expect(avatarSource).toContain('/default-avatar.svg')
  }

  expect(app).toContain('user-pic')
  expect(articleMeta).toContain('<img')
  expect(comment).toContain('ion-trash-a')
  expect(tags).toContain('tag-default')
  expect(actions).toContain('btn-outline-primary')
  expect(actions).toContain('btn-primary')
  expect(settings).toContain('btn-outline-danger')
})
