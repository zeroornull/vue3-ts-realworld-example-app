import { defineStore } from 'pinia'
import {
  readToken,
  removeToken,
  saveToken,
  type TokenStorage,
} from '../services/jwt'
import type { User } from '../types/realworld'
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
    hydrateFromStorage(storage?: TokenStorage | null): void {
      this.$patch(createAuthStateFromToken(readToken(storage)))
    },

    setLocalSession(user: User, storage?: TokenStorage | null): void {
      saveToken(user.token, storage)
      this.$patch(createAuthenticatedState(this.$state, user))
    },

    logout(storage?: TokenStorage | null): void {
      removeToken(storage)
      this.$patch(createUnauthenticatedState(this.$state))
    },
  },
})
