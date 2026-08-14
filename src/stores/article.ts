import { defineStore } from 'pinia'
import {
  addArticleFavorite,
  createArticleComment,
  deleteArticleComment,
  getArticle,
  getArticleComments,
  isArticleResponse,
  isCommentResponse,
  isCommentsResponse,
  removeArticleFavorite,
} from '../services/articles'
import {
  ApiError,
  ConnectivityError,
  UnexpectedResponseError,
  ValidationError,
} from '../services/errors'
import type { Article, Comment } from '../types/realworld'
import { useHomeStore } from './home'

export type ArticleStatus = 'idle' | 'loading' | 'success' | 'error'

export type ArticleState = {
  status: ArticleStatus
  article: Article | null
  error: string | null
  requestId: number
  commentsStatus: ArticleStatus
  comments: Comment[]
  commentsError: string | null
  commentsSlug: string | null
  commentsRequestId: number
}

function cloneArticle(article: Article): Article {
  return {
    ...article,
    tagList: [...article.tagList],
    author: { ...article.author },
  }
}

function cloneComment(comment: Comment): Comment {
  return {
    ...comment,
    author: { ...comment.author },
  }
}

function toArticleErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return 'Article not found.'
  }

  if (error instanceof ConnectivityError) {
    return 'Unable to connect to the article service.'
  }

  if (error instanceof ApiError) {
    return `Unable to load the article (HTTP ${error.status}).`
  }

  if (error instanceof UnexpectedResponseError) {
    return 'The article service returned an invalid response.'
  }

  return 'Unable to load the article.'
}

function toCommentsErrorMessage(error: unknown): string {
  if (error instanceof ConnectivityError) {
    return 'Unable to connect to the comments service.'
  }

  if (error instanceof ApiError) {
    return `Unable to load comments (HTTP ${error.status}).`
  }

  if (error instanceof UnexpectedResponseError) {
    return 'The comments service returned an invalid response.'
  }

  return 'Unable to load comments.'
}

function requireToken(token: string | null, action: string): string {
  if (!token) {
    throw new ValidationError('Authentication is required', {
      session: [`is required to ${action}`],
    })
  }

  return token
}

export const useArticleStore = defineStore('article', {
  state: (): ArticleState => ({
    status: 'idle',
    article: null,
    error: null,
    requestId: 0,
    commentsStatus: 'idle',
    comments: [],
    commentsError: null,
    commentsSlug: null,
    commentsRequestId: 0,
  }),

  actions: {
    async fetchArticle(
      slug: string,
      token: string | null = null,
    ): Promise<void> {
      const requestId = ++this.requestId
      this.status = 'loading'
      this.article = null
      this.error = null

      try {
        const response = await getArticle(slug, token)

        if (requestId !== this.requestId) {
          return
        }

        if (!isArticleResponse(response)) {
          throw new UnexpectedResponseError('GET articles/:slug')
        }

        this.article = cloneArticle(response.article)
        this.status = 'success'
      } catch (error: unknown) {
        if (requestId !== this.requestId) {
          return
        }

        this.article = null
        this.error = toArticleErrorMessage(error)
        this.status = 'error'
      }
    },

    async fetchComments(
      slug: string,
      token: string | null = null,
    ): Promise<boolean> {
      const requestId = ++this.commentsRequestId

      if (this.commentsSlug !== slug) {
        this.comments = []
        this.commentsSlug = slug
      }

      this.commentsStatus = 'loading'
      this.commentsError = null

      try {
        const response = await getArticleComments(slug, token)

        if (requestId !== this.commentsRequestId) {
          return false
        }

        if (!isCommentsResponse(response)) {
          throw new UnexpectedResponseError('GET articles/:slug/comments')
        }

        this.comments = response.comments.map(cloneComment)
        this.commentsStatus = 'success'
        return true
      } catch (error: unknown) {
        if (requestId !== this.commentsRequestId) {
          return false
        }

        this.commentsError = toCommentsErrorMessage(error)
        this.commentsStatus = 'error'
        return false
      }
    },

    async createComment(
      slug: string,
      body: string,
      token: string | null,
    ): Promise<void> {
      const normalizedBody = body.trim()

      if (!normalizedBody) {
        throw new ValidationError('Comment body cannot be blank', {
          body: ['cannot be blank'],
        })
      }

      const sessionToken = requireToken(token, 'post a comment')
      const response = await createArticleComment(
        slug,
        normalizedBody,
        sessionToken,
      )

      if (isCommentResponse(response)) {
        this.comments = [...this.comments, cloneComment(response.comment)]
        this.commentsSlug = slug
        this.commentsStatus = 'success'
        this.commentsError = null
        return
      }

      const reloaded = await this.fetchComments(slug, sessionToken)

      if (!reloaded) {
        throw new UnexpectedResponseError('POST articles/:slug/comments')
      }
    },

    async deleteComment(
      slug: string,
      commentId: number,
      token: string | null,
    ): Promise<void> {
      const sessionToken = requireToken(token, 'delete a comment')

      await deleteArticleComment(slug, commentId, sessionToken)
      this.comments = this.comments.filter(
        (comment) => comment.id !== commentId,
      )
    },

    async updateFavorite(
      slug: string,
      shouldFavorite: boolean,
      token: string | null,
    ): Promise<void> {
      const sessionToken = requireToken(token, 'update favorites')
      const response = shouldFavorite
        ? await addArticleFavorite(slug, sessionToken)
        : await removeArticleFavorite(slug, sessionToken)

      if (!isArticleResponse(response)) {
        throw new UnexpectedResponseError(
          `${shouldFavorite ? 'POST' : 'DELETE'} articles/:slug/favorite`,
        )
      }

      const updatedArticle = cloneArticle(response.article)

      useHomeStore().updateArticleFavorite(updatedArticle)

      if (this.article?.slug === slug) {
        this.article = updatedArticle
      }
    },

    async addFavorite(slug: string, token: string | null): Promise<void> {
      await this.updateFavorite(slug, true, token)
    },

    async removeFavorite(slug: string, token: string | null): Promise<void> {
      await this.updateFavorite(slug, false, token)
    },
  },
})
