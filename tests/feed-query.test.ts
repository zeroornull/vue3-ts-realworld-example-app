import { describe, expect, it } from 'bun:test'
import {
  ARTICLES_PER_PAGE,
  createArticlesQuery,
  createPaginationPages,
  normalizeFeedTag,
  parseFeedPage,
  resolveFeedMode,
} from '../src/router/feed-query'

describe('feed query parsing', () => {
  it('accepts positive integer pages and rejects unstable values', () => {
    expect(parseFeedPage('3')).toBe(3)
    expect(parseFeedPage(undefined)).toBe(1)
    expect(parseFeedPage('abc')).toBe(1)
    expect(parseFeedPage('0')).toBe(1)
    expect(parseFeedPage('-1')).toBe(1)
    expect(parseFeedPage('1.5')).toBe(1)
    expect(parseFeedPage(['2'])).toBe(1)
    expect(parseFeedPage(String(Number.MAX_SAFE_INTEGER + 1))).toBe(1)
    expect(parseFeedPage(String(Number.MAX_SAFE_INTEGER))).toBe(1)
  })

  it('converts page and tag into API limit, offset, and tag', () => {
    expect(createArticlesQuery(3, 'vue')).toEqual({
      limit: ARTICLES_PER_PAGE,
      offset: 20,
      tag: 'vue',
    })
    expect(createArticlesQuery(0, null)).toEqual({
      limit: ARTICLES_PER_PAGE,
      offset: 0,
    })
    expect(normalizeFeedTag('  typescript  ')).toBe('typescript')
    expect(normalizeFeedTag(['vue'])).toBeNull()
  })

  it('creates pagination only when more than one page exists', () => {
    expect(createPaginationPages(0)).toEqual([])
    expect(createPaginationPages(10)).toEqual([])
    expect(createPaginationPages(21)).toEqual([1, 2, 3])
    expect(createPaginationPages(21, 0)).toEqual([])
  })

  it('resolves Global, Your, and Tag feed modes defensively', () => {
    expect(resolveFeedMode('following', null)).toBe('following')
    expect(resolveFeedMode(['following'], null)).toBe('global')
    expect(resolveFeedMode('anything-else', null)).toBe('global')
    expect(resolveFeedMode('following', 'vue')).toBe('tag')
  })
})
