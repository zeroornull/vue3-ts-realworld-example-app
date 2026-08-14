export type User = {
  email: string
  token: string
  username: string
  bio: string | null
  image: string | null
}

export type ApiErrors = Record<string, string[]>

export type ApiErrorPayload = {
  errors: ApiErrors
}

export type ArticleAuthor = {
  username: string
  bio: string | null
  image: string | null
  following: boolean
}

export type ArticleSummary = {
  slug: string
  title: string
  description: string
  tagList: string[]
  createdAt: string
  updatedAt: string
  favorited: boolean
  favoritesCount: number
  author: ArticleAuthor
}

export type Article = ArticleSummary & {
  body: string
}

export type ArticleDraft = {
  title: string
  description: string
  body: string
  tagList: string[]
}

export type ArticlesResponse = {
  articles: ArticleSummary[]
  articlesCount: number
}

export type ArticleResponse = {
  article: Article
}

export type Comment = {
  id: number
  createdAt: string
  updatedAt: string
  body: string
  author: ArticleAuthor
}

export type CommentsResponse = {
  comments: Comment[]
}

export type CommentResponse = {
  comment: Comment
}

export type UserResponse = {
  user: User
}

export type LoginCredentials = {
  email: string
  password: string
}

export type RegistrationCredentials = LoginCredentials & {
  username: string
}
