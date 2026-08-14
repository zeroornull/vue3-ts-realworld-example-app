import type { ArticlesQuery } from '../services/articles'

export const ARTICLES_PER_PAGE = 10

export function parseFeedPage(value: unknown): number {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    return 1
  }

  const page = Number(value)
  const offset = (page - 1) * ARTICLES_PER_PAGE

  return Number.isSafeInteger(page) && Number.isSafeInteger(offset) ? page : 1
}

export function normalizeFeedTag(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  return value.trim() || null
}

export function createArticlesQuery(
  page: number,
  tag: string | null,
): ArticlesQuery {
  const safePage = Number.isSafeInteger(page) && page > 0 ? page : 1

  return {
    limit: ARTICLES_PER_PAGE,
    offset: (safePage - 1) * ARTICLES_PER_PAGE,
    ...(tag ? { tag } : {}),
  }
}

export function createPaginationPages(
  articlesCount: number,
  itemsPerPage = ARTICLES_PER_PAGE,
): number[] {
  if (
    !Number.isSafeInteger(articlesCount) ||
    articlesCount <= itemsPerPage ||
    !Number.isSafeInteger(itemsPerPage) ||
    itemsPerPage <= 0
  ) {
    return []
  }

  return Array.from(
    { length: Math.ceil(articlesCount / itemsPerPage) },
    (_, index) => index + 1,
  )
}
