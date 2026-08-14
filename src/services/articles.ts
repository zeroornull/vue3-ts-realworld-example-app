import type {
  ArticleAuthor,
  ArticleSummary,
  ArticlesResponse,
} from '../types/realworld'
import { request } from './api'

export type ArticlesQuery = {
  limit: number
  offset: number
  tag?: string
}

function createArticlesSearch(query: ArticlesQuery): URLSearchParams {
  const search = new URLSearchParams({
    limit: String(query.limit),
    offset: String(query.offset),
  })

  if (query.tag) {
    search.set('tag', query.tag)
  }

  return search
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isArticleAuthor(value: unknown): value is ArticleAuthor {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.username === 'string' &&
    (typeof value.bio === 'string' || value.bio === null) &&
    (typeof value.image === 'string' || value.image === null) &&
    typeof value.following === 'boolean'
  )
}

export function isArticleSummary(value: unknown): value is ArticleSummary {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.slug === 'string' &&
    typeof value.title === 'string' &&
    typeof value.description === 'string' &&
    Array.isArray(value.tagList) &&
    value.tagList.every((tag) => typeof tag === 'string') &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string' &&
    typeof value.favorited === 'boolean' &&
    Number.isSafeInteger(value.favoritesCount) &&
    typeof value.favoritesCount === 'number' &&
    value.favoritesCount >= 0 &&
    isArticleAuthor(value.author)
  )
}

export function isArticlesResponse(value: unknown): value is ArticlesResponse {
  if (!isRecord(value)) {
    return false
  }

  return (
    Array.isArray(value.articles) &&
    value.articles.every(isArticleSummary) &&
    typeof value.articlesCount === 'number' &&
    Number.isSafeInteger(value.articlesCount) &&
    value.articlesCount >= 0
  )
}

export function isTagsResponse(value: unknown): value is { tags: string[] } {
  return (
    isRecord(value) &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === 'string')
  )
}

export function getGlobalArticles(
  query: ArticlesQuery,
): Promise<unknown | null> {
  return request<unknown>(`articles?${createArticlesSearch(query)}`)
}

export function getUserFeed(
  token: string,
  query: ArticlesQuery,
): Promise<unknown | null> {
  return request<unknown>(`articles/feed?${createArticlesSearch(query)}`, {
    token,
  })
}

export function getTags(): Promise<unknown | null> {
  return request<unknown>('tags')
}
