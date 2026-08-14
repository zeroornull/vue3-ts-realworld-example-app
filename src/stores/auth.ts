import { defineStore } from 'pinia'
import {
  getCurrentUser,
  isUserResponse,
  loginUser,
  registerUser,
} from '../services/auth'
import {
  ApiError,
  toApiErrors,
  UnexpectedResponseError,
} from '../services/errors'
import {
  readToken,
  removeToken,
  saveToken,
  type TokenStorage,
} from '../services/jwt'
import type {
  LoginCredentials,
  RegistrationCredentials,
  User,
} from '../types/realworld'
import {
  createAuthenticatedState,
  createAuthStateFromToken,
  createLoadingAuthState,
  createUnauthenticatedState,
  createUnavailableState,
  type AuthStatus,
  type AuthState,
} from './auth-state'

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => createLoadingAuthState(),

  getters: {
    isAuthenticated: (state) =>
      state.status === 'authenticated' && Boolean(state.token),
    currentUser: (state) => state.user,
  },

  actions: {
    clearErrors(): void {
      this.errors = {}
    },

    hydrateFromStorage(storage?: TokenStorage | null): void {
      this.$patch(createAuthStateFromToken(readToken(storage)))
    },

    async restoreSession(storage?: TokenStorage | null): Promise<void> {
      const token = this.token ?? readToken(storage)

      if (!token) {
        this.$patch(createUnauthenticatedState(this.$state))
        return
      }

      this.$patch(createAuthStateFromToken(token))

      try {
        const response = await getCurrentUser(token)

        if (!isUserResponse(response)) {
          this.$patch(createUnavailableState(this.$state))
          return
        }

        this.setLocalSession(response.user, storage)
      } catch (error: unknown) {
        if (
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500
        ) {
          removeToken(storage)
          this.$patch(createUnauthenticatedState(this.$state))
          return
        }

        this.$patch(createUnavailableState(this.$state))
      }
    },

    setLocalSession(user: User, storage?: TokenStorage | null): void {
      saveToken(user.token, storage)
      this.$patch(createAuthenticatedState(this.$state, user))
    },

    async login(
      credentials: LoginCredentials,
      storage?: TokenStorage | null,
    ): Promise<User> {
      const previousStatus: AuthStatus = this.status
      this.status = 'loading'
      this.errors = {}

      try {
        const response = await loginUser(credentials)

        if (!isUserResponse(response)) {
          throw new UnexpectedResponseError('POST users/login')
        }

        this.setLocalSession(response.user, storage)
        return response.user
      } catch (error: unknown) {
        this.status =
          previousStatus === 'loading'
            ? this.user && this.token
              ? 'authenticated'
              : 'unauthenticated'
            : previousStatus
        this.errors = toApiErrors(error)
        throw error
      }
    },

    async register(
      credentials: RegistrationCredentials,
      storage?: TokenStorage | null,
    ): Promise<User> {
      const previousStatus: AuthStatus = this.status
      this.status = 'loading'
      this.errors = {}

      try {
        const response = await registerUser(credentials)

        if (!isUserResponse(response)) {
          throw new UnexpectedResponseError('POST users')
        }

        this.setLocalSession(response.user, storage)
        return response.user
      } catch (error: unknown) {
        this.status =
          previousStatus === 'loading'
            ? this.user && this.token
              ? 'authenticated'
              : 'unauthenticated'
            : previousStatus
        this.errors = toApiErrors(error)
        throw error
      }
    },

    logout(storage?: TokenStorage | null): void {
      removeToken(storage)
      this.$patch(createUnauthenticatedState(this.$state))
    },
  },
})
