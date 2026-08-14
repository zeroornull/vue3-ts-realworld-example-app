import { defineStore } from 'pinia'
import { loginUser, registerUser } from '../services/auth'
import { toApiErrors, UnexpectedResponseError } from '../services/errors'
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

    setLocalSession(user: User, storage?: TokenStorage | null): void {
      saveToken(user.token, storage)
      this.$patch(createAuthenticatedState(this.$state, user))
    },

    async login(
      credentials: LoginCredentials,
      storage?: TokenStorage | null,
    ): Promise<User> {
      this.status = 'loading'
      this.errors = {}

      try {
        const response = await loginUser(credentials)

        if (!response) {
          throw new UnexpectedResponseError('POST users/login')
        }

        this.setLocalSession(response.user, storage)
        return response.user
      } catch (error: unknown) {
        this.status = this.token ? 'authenticated' : 'unauthenticated'
        this.errors = toApiErrors(error)
        throw error
      }
    },

    async register(
      credentials: RegistrationCredentials,
      storage?: TokenStorage | null,
    ): Promise<User> {
      this.status = 'loading'
      this.errors = {}

      try {
        const response = await registerUser(credentials)

        if (!response) {
          throw new UnexpectedResponseError('POST users')
        }

        this.setLocalSession(response.user, storage)
        return response.user
      } catch (error: unknown) {
        this.status = this.token ? 'authenticated' : 'unauthenticated'
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
