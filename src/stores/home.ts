import { defineStore } from 'pinia'
import {
  getGlobalArticles,
  getTags,
  isArticlesResponse,
  isTagsResponse,
  type ArticlesQuery,
} from '../services/articles'
import {
  ApiError,
  ConnectivityError,
  UnexpectedResponseError,
} from '../services/errors'
import type { ArticleSummary } from '../types/realworld'

export type HomeStatus = 'idle' | 'loading' | 'success' | 'error'
export type TagsStatus = HomeStatus

export type HomeState = {
  status: HomeStatus
  articles: ArticleSummary[]
  articlesCount: number
  error: string | null
  tagsStatus: TagsStatus
  tags: string[]
  tagsError: string | null
}

function cloneArticle(article: ArticleSummary): ArticleSummary {
  return {
    ...article,
    tagList: [...article.tagList],
    author: { ...article.author },
  }
}

function toFeedErrorMessage(error: unknown): string {
  if (error instanceof ConnectivityError) {
    return 'Unable to connect to the article service.'
  }

  if (error instanceof ApiError) {
    return `Unable to load articles (HTTP ${error.status}).`
  }

  if (error instanceof UnexpectedResponseError) {
    return 'The article service returned an invalid response.'
  }

  return 'Unable to load articles.'
}

export const useHomeStore = defineStore('home', {
  state: (): HomeState => ({
    status: 'idle',
    articles: [],
    articlesCount: 0,
    error: null,
    tagsStatus: 'idle',
    tags: [],
    tagsError: null,
  }),

  getters: {
    isLoading: (state) => state.status === 'loading',
  },

  actions: {
    async fetchGlobalFeed(query: ArticlesQuery): Promise<void> {
      this.status = 'loading'
      this.error = null

      try {
        const response = await getGlobalArticles(query)

        if (!isArticlesResponse(response)) {
          throw new UnexpectedResponseError('GET articles')
        }

        this.articles = response.articles.map(cloneArticle)
        this.articlesCount = response.articlesCount
        this.status = 'success'
      } catch (error: unknown) {
        this.articles = []
        this.articlesCount = 0
        this.error = toFeedErrorMessage(error)
        this.status = 'error'
      }
    },

    async fetchTags(): Promise<void> {
      this.tagsStatus = 'loading'
      this.tagsError = null

      try {
        const response = await getTags()

        if (!isTagsResponse(response)) {
          throw new UnexpectedResponseError('GET tags')
        }

        this.tags = [...response.tags]
        this.tagsStatus = 'success'
      } catch {
        this.tags = []
        this.tagsError = 'Popular tags are temporarily unavailable.'
        this.tagsStatus = 'error'
      }
    },
  },
})
