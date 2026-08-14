import { defineStore } from 'pinia'
import {
  getGlobalArticles,
  getTags,
  getUserFeed,
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
export type FeedSource = 'global' | 'following'

export type HomeState = {
  status: HomeStatus
  articles: ArticleSummary[]
  articlesCount: number
  error: string | null
  tagsStatus: TagsStatus
  tags: string[]
  tagsError: string | null
  feedRequestId: number
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
    feedRequestId: 0,
  }),

  getters: {
    isLoading: (state) => state.status === 'loading',
  },

  actions: {
    async fetchFeed(
      source: FeedSource,
      query: ArticlesQuery,
      token: string | null = null,
    ): Promise<void> {
      const requestId = ++this.feedRequestId
      this.status = 'loading'
      this.error = null

      try {
        let response: unknown | null

        if (source === 'following') {
          if (!token) {
            this.articles = []
            this.articlesCount = 0
            this.error = 'Sign in to view your feed.'
            this.status = 'error'
            return
          }

          response = await getUserFeed(token, query)
        } else {
          response = await getGlobalArticles(query)
        }

        if (requestId !== this.feedRequestId) {
          return
        }

        if (!isArticlesResponse(response)) {
          throw new UnexpectedResponseError(
            source === 'following' ? 'GET articles/feed' : 'GET articles',
          )
        }

        this.articles = response.articles.map(cloneArticle)
        this.articlesCount = response.articlesCount
        this.status = 'success'
      } catch (error: unknown) {
        if (requestId !== this.feedRequestId) {
          return
        }

        this.articles = []
        this.articlesCount = 0
        this.error = toFeedErrorMessage(error)
        this.status = 'error'
      }
    },

    async fetchGlobalFeed(query: ArticlesQuery): Promise<void> {
      await this.fetchFeed('global', query)
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
