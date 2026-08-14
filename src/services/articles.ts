import type {
  Article,
  ArticleAuthor,
  ArticleDraft,
  ArticleResponse,
  ArticleSummary,
  ArticlesResponse,
  Comment,
  CommentResponse,
  CommentsResponse,
} from '../types/realworld'
import { request } from './api'

export type ArticlesQuery = {
  limit: number
  offset: number
  tag?: string
  author?: string
  favorited?: string
}

function createArticlesSearch(query: ArticlesQuery): URLSearchParams {
  const search = new URLSearchParams({
    limit: String(query.limit),
    offset: String(query.offset),
  })

  if (query.tag) {
    search.set('tag', query.tag)
  }

  if (query.author) {
    search.set('author', query.author)
  }

  if (query.favorited) {
    search.set('favorited', query.favorited)
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

export function isArticle(value: unknown): value is Article {
  return (
    isRecord(value) &&
    isArticleSummary(value) &&
    'body' in value &&
    typeof value.body === 'string'
  )
}

export function isArticleResponse(value: unknown): value is ArticleResponse {
  return isRecord(value) && isArticle(value.article)
}

export function isComment(value: unknown): value is Comment {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'number' &&
    Number.isSafeInteger(value.id) &&
    value.id >= 0 &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string' &&
    typeof value.body === 'string' &&
    isArticleAuthor(value.author)
  )
}

export function isCommentsResponse(value: unknown): value is CommentsResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.comments) &&
    value.comments.every(isComment)
  )
}

export function isCommentResponse(value: unknown): value is CommentResponse {
  return isRecord(value) && isComment(value.comment)
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

export function getProfileArticles(
  username: string,
  query: Omit<ArticlesQuery, 'author' | 'favorited'>,
  token: string | null = null,
): Promise<unknown | null> {
  return request<unknown>(
    `articles?${createArticlesSearch({ ...query, author: username })}`,
    { token },
  )
}

export function getFavoritedArticles(
  username: string,
  query: Omit<ArticlesQuery, 'author' | 'favorited'>,
  token: string | null = null,
): Promise<unknown | null> {
  return request<unknown>(
    `articles?${createArticlesSearch({ ...query, favorited: username })}`,
    { token },
  )
}

export function getArticle(
  slug: string,
  token: string | null = null,
): Promise<unknown | null> {
  return request<unknown>(`articles/${encodeURIComponent(slug)}`, { token })
}

export function createArticle(
  draft: ArticleDraft,
  token: string,
): Promise<unknown | null> {
  return request<unknown>('articles', {
    method: 'POST',
    token,
    body: { article: draft },
  })
}

export function updateArticle(
  slug: string,
  draft: ArticleDraft,
  token: string,
): Promise<unknown | null> {
  return request<unknown>(`articles/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    token,
    body: { article: draft },
  })
}

export function deleteArticle(
  slug: string,
  token: string,
): Promise<unknown | null> {
  return request<unknown>(`articles/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
    token,
  })
}

export function getArticleComments(
  slug: string,
  token: string | null = null,
): Promise<unknown | null> {
  return request<unknown>(`articles/${encodeURIComponent(slug)}/comments`, {
    token,
  })
}

export function createArticleComment(
  slug: string,
  body: string,
  token: string,
): Promise<unknown | null> {
  return request<unknown>(`articles/${encodeURIComponent(slug)}/comments`, {
    method: 'POST',
    token,
    body: { comment: { body } },
  })
}

export function deleteArticleComment(
  slug: string,
  commentId: number,
  token: string,
): Promise<unknown | null> {
  return request<unknown>(
    `articles/${encodeURIComponent(slug)}/comments/${encodeURIComponent(String(commentId))}`,
    { method: 'DELETE', token },
  )
}

export function addArticleFavorite(
  slug: string,
  token: string,
): Promise<unknown | null> {
  return request<unknown>(`articles/${encodeURIComponent(slug)}/favorite`, {
    method: 'POST',
    token,
  })
}

export function removeArticleFavorite(
  slug: string,
  token: string,
): Promise<unknown | null> {
  return request<unknown>(`articles/${encodeURIComponent(slug)}/favorite`, {
    method: 'DELETE',
    token,
  })
}

export function getTags(): Promise<unknown | null> {
  return request<unknown>('tags')
}
