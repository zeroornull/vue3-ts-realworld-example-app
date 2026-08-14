import { defineStore } from 'pinia'
import { getArticle, isArticleResponse } from '../services/articles'
import {
  ApiError,
  ConnectivityError,
  UnexpectedResponseError,
} from '../services/errors'
import type { Article } from '../types/realworld'

export type ArticleStatus = 'idle' | 'loading' | 'success' | 'error'

export type ArticleState = {
  status: ArticleStatus
  article: Article | null
  error: string | null
  requestId: number
}

function cloneArticle(article: Article): Article {
  return {
    ...article,
    tagList: [...article.tagList],
    author: { ...article.author },
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

export const useArticleStore = defineStore('article', {
  state: (): ArticleState => ({
    status: 'idle',
    article: null,
    error: null,
    requestId: 0,
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
  },
})
