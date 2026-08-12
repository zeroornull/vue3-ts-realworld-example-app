export type User = {
  username: string
  email: string
  bio: string | null
  image: string | null
  token: string
}

export type Profile = {
  username: string
  bio: string | null
  image: string | null
  following: boolean
}

export type Article = {
  slug: string
  title: string
  description: string
  body: string
  tagList: string[]
  createdAt: string
  updatedAt: string
  favorited: boolean
  favoritesCount: number
  author: Profile
}

export type ArticleDraft = {
  slug?: string
  title: string
  description: string
  body: string
  tagList: string[]
}

export type Comment = {
  id: number
  createdAt: string
  updatedAt: string
  body: string
  author: Profile
}

export type ArticleQuery = {
  tag?: string
  author?: string
  favorited?: string
  limit: number
  offset: number
}

export type ArticleListResponse = {
  articles: Article[]
  articlesCount: number
}

export type UserResponse = {
  user: User
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value)
}

function isProfile(value: unknown): value is Profile {
  if (!isRecord(value)) return false

  return (
    isString(value.username) &&
    isNullableString(value.bio) &&
    isNullableString(value.image) &&
    typeof value.following === 'boolean'
  )
}

export function isPublishedArticle(value: unknown): value is Article {
  if (!isRecord(value)) return false
  if (!isString(value.slug)) return false
  if (!isString(value.title)) return false
  if (!isString(value.description)) return false
  if (!isString(value.body)) return false
  if (!Array.isArray(value.tagList)) return false
  if (!value.tagList.every(isString)) return false
  if (!isString(value.createdAt)) return false
  if (!isString(value.updatedAt)) return false
  if (typeof value.favorited !== 'boolean') return false
  if (typeof value.favoritesCount !== 'number') return false
  return isProfile(value.author)
}
