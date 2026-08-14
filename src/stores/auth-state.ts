import type { User } from '../types/realworld'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export type AuthState = {
  status: AuthStatus
  token: string | null
  user: User | null
}

export function createLoadingAuthState(): AuthState {
  return {
    status: 'loading',
    token: null,
    user: null,
  }
}

export function createAuthStateFromToken(token: string | null): AuthState {
  if (!token) {
    return {
      status: 'unauthenticated',
      token: null,
      user: null,
    }
  }

  return {
    status: 'authenticated',
    token,
    user: null,
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
  }
}

export function createUnauthenticatedState(state: AuthState): AuthState {
  return {
    ...state,
    status: 'unauthenticated',
    token: null,
    user: null,
  }
}
