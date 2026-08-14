import { describe, expect, it } from 'bun:test'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '../src/router'

describe('router skeleton', () => {
  const router = createAppRouter(createMemoryHistory())

  it('resolves article and profile parameters', () => {
    expect(router.resolve('/article/demo-slug')).toMatchObject({
      name: 'article',
      params: { slug: 'demo-slug' },
    })

    expect(router.resolve('/profile/alice')).toMatchObject({
      name: 'profile',
      params: { username: 'alice' },
    })

    expect(router.resolve('/profile/alice?page=2')).toMatchObject({
      name: 'profile',
      params: { username: 'alice' },
      query: { page: '2' },
    })

    expect(router.resolve('/profile/alice/favorites?page=3')).toMatchObject({
      name: 'profile-favorites',
      params: { username: 'alice' },
      query: { page: '3' },
    })
  })

  it('keeps home query parameters and catches unknown paths', () => {
    expect(router.resolve('/?page=2')).toMatchObject({
      name: 'home',
      query: { page: '2' },
    })

    expect(router.resolve('/missing-page')).toMatchObject({
      name: 'not-found',
    })
  })

  it('resolves tag feeds with their page query', () => {
    expect(router.resolve('/tag/vue?page=3')).toMatchObject({
      name: 'tag',
      params: { tag: 'vue' },
      query: { page: '3' },
    })
  })

  it('marks settings and editor as protected routes', () => {
    expect(router.resolve('/settings').meta.requiresAuth).toBe(true)
    expect(router.resolve('/editor').meta.requiresAuth).toBe(true)
    expect(router.resolve('/editor/example-slug')).toMatchObject({
      name: 'article-edit',
      params: { slug: 'example-slug' },
    })
    expect(router.resolve('/editor/example-slug').meta.requiresAuth).toBe(true)
  })
})
