import type { ApiErrors, User } from '../types/realworld'

export type AuthStatus =
  'loading' | 'authenticated' | 'unauthenticated' | 'unavailable'

export type AuthState = {
  status: AuthStatus
  token: string | null
  user: User | null
  errors: ApiErrors
}

export function createLoadingAuthState(): AuthState {
  return {
    status: 'loading',
    token: null,
    user: null,
    errors: {},
  }
}

export function createAuthStateFromToken(token: string | null): AuthState {
  if (!token) {
    return {
      status: 'unauthenticated',
      token: null,
      user: null,
      errors: {},
    }
  }

  return {
    status: 'loading',
    token,
    user: null,
    errors: {},
  }
}

export function createUnavailableState(state: AuthState): AuthState {
  return {
    ...state,
    status: 'unavailable',
    user: null,
    errors: {},
  }
}

export function createAuthenticatedState(
  state: AuthState,
  user: User,
): AuthState {
  return {
    ...state,
    status: 'authenticated',
    token: user.token,
    user: { ...user },
    errors: {},
  }
}

export function createUnauthenticatedState(state: AuthState): AuthState {
  return {
    ...state,
    status: 'unauthenticated',
    token: null,
    user: null,
    errors: {},
  }
}
