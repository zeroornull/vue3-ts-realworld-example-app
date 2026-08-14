import { defineStore } from 'pinia'
import {
  getProfileArticles,
  isArticlesResponse,
  type ArticlesQuery,
} from '../services/articles'
import {
  ApiError,
  ConnectivityError,
  UnexpectedResponseError,
} from '../services/errors'
import { getProfile, isProfileResponse } from '../services/profiles'
import type { ArticleSummary, Profile } from '../types/realworld'

export type ProfileStatus = 'idle' | 'loading' | 'success' | 'error'

const PROFILE_FETCH_RETRIES = 2
const PROFILE_FETCH_RETRY_DELAY_MS = 400

export type ProfileState = {
  status: ProfileStatus
  profile: Profile | null
  error: string | null
  requestId: number
  articlesStatus: ProfileStatus
  articles: ArticleSummary[]
  articlesCount: number
  articlesError: string | null
  articlesRequestId: number
}

function cloneProfile(profile: Profile): Profile {
  return { ...profile }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds))
}

function shouldRetryProfile(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404
}

function cloneArticle(article: ArticleSummary): ArticleSummary {
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    tagList: [...article.tagList],
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    favorited: article.favorited,
    favoritesCount: article.favoritesCount,
    author: { ...article.author },
  }
}

function toProfileErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return 'Profile not found.'
  }

  if (error instanceof ConnectivityError) {
    return 'Unable to connect to the profile service.'
  }

  if (error instanceof ApiError) {
    return `Unable to load the profile (HTTP ${error.status}).`
  }

  if (error instanceof UnexpectedResponseError) {
    return 'The profile service returned an invalid response.'
  }

  return 'Unable to load the profile.'
}

function toArticlesErrorMessage(error: unknown): string {
  if (error instanceof ConnectivityError) {
    return 'Unable to connect to the article service.'
  }

  if (error instanceof ApiError) {
    return `Unable to load profile articles (HTTP ${error.status}).`
  }

  if (error instanceof UnexpectedResponseError) {
    return 'The article service returned an invalid response.'
  }

  return 'Unable to load profile articles.'
}

export const useProfileStore = defineStore('profile', {
  state: (): ProfileState => ({
    status: 'idle',
    profile: null,
    error: null,
    requestId: 0,
    articlesStatus: 'idle',
    articles: [],
    articlesCount: 0,
    articlesError: null,
    articlesRequestId: 0,
  }),

  actions: {
    async fetchProfile(
      username: string,
      token: string | null = null,
    ): Promise<void> {
      const requestId = ++this.requestId
      this.status = 'loading'
      this.profile = null
      this.error = null

      for (let attempt = 0; attempt <= PROFILE_FETCH_RETRIES; attempt += 1) {
        if (requestId !== this.requestId) {
          return
        }

        try {
          const response = await getProfile(username, token)

          if (requestId !== this.requestId) {
            return
          }

          if (!isProfileResponse(response)) {
            throw new UnexpectedResponseError('GET profiles/:username')
          }

          this.profile = cloneProfile(response.profile)
          this.status = 'success'
          return
        } catch (error: unknown) {
          if (requestId !== this.requestId) {
            return
          }

          if (!shouldRetryProfile(error) || attempt === PROFILE_FETCH_RETRIES) {
            this.profile = null
            this.error = toProfileErrorMessage(error)
            this.status = 'error'
            return
          }

          await delay(PROFILE_FETCH_RETRY_DELAY_MS)
        }
      }
    },

    async fetchArticles(
      username: string,
      query: Omit<ArticlesQuery, 'author'>,
      token: string | null = null,
    ): Promise<void> {
      const requestId = ++this.articlesRequestId
      this.articlesStatus = 'loading'
      this.articles = []
      this.articlesCount = 0
      this.articlesError = null

      try {
        const response = await getProfileArticles(username, query, token)

        if (requestId !== this.articlesRequestId) {
          return
        }

        if (!isArticlesResponse(response)) {
          throw new UnexpectedResponseError('GET articles?author=:username')
        }

        this.articles = response.articles.map(cloneArticle)
        this.articlesCount = response.articlesCount
        this.articlesStatus = 'success'
      } catch (error: unknown) {
        if (requestId !== this.articlesRequestId) {
          return
        }

        this.articles = []
        this.articlesCount = 0
        this.articlesError = toArticlesErrorMessage(error)
        this.articlesStatus = 'error'
      }
    },
  },
})
