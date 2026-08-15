import { expect, test } from 'bun:test'

const root = new URL('../', import.meta.url)

async function read(relativePath: string): Promise<string> {
  return Bun.file(new URL(relativePath, root)).text()
}

test('keeps the Vite base path configurable for project Pages sites', async () => {
  const viteConfig = await read('vite.config.ts')

  expect(viteConfig).toContain('VITE_BASE_PATH')
  expect(viteConfig).toContain('resolveBasePath')
})

test('keeps the GitHub Pages workflow and SPA fallback in sync', async () => {
  const [workflow, fallback, index] = await Promise.all([
    read('.github/workflows/deploy-pages.yml'),
    read('public/404.html'),
    read('index.html'),
  ])

  expect(workflow).toContain('submodules: recursive')
  expect(workflow).toContain('bun install --frozen-lockfile')
  expect(workflow).toContain('bun run build')
  expect(workflow).toContain('actions/upload-pages-artifact@v4')
  expect(workflow).toContain('actions/deploy-pages@v4')
  expect(fallback).toContain('repositorySegments = 1')
  expect(fallback).toContain('location.replace')
  expect(index).toContain('restoreGitHubPagesRoute')
  expect(index).toContain('history.replaceState')
})
