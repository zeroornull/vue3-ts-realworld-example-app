import { describe, expect, it } from 'bun:test'
import type { User } from './domain'
import {
  initialAuthState,
  transitionAuthState,
  type AuthState,
} from './auth-state'

const user: User = {
  username: 'student',
  email: 'student@example.com',
  bio: null,
  image: null,
  token: 'token-1',
}

describe('auth state transitions', () => {
  it('starts unauthenticated when the token is missing', () => {
    expect(
      transitionAuthState(initialAuthState(), { type: 'TOKEN_MISSING' }),
    ).toEqual({
      status: 'unauthenticated',
      user: null,
      token: null,
    })
  })

  it('authenticates after a successful login', () => {
    expect(
      transitionAuthState(initialAuthState(), {
        type: 'AUTH_SUCCESS',
        user,
      }),
    ).toEqual({
      status: 'authenticated',
      user,
      token: 'token-1',
    })
  })

  it('restores an authenticated user after a successful refresh', () => {
    const unavailableState: AuthState = {
      status: 'unavailable',
      user: null,
      token: 'token-1',
    }

    expect(
      transitionAuthState(unavailableState, {
        type: 'AUTH_SUCCESS',
        user,
      }),
    ).toEqual({
      status: 'authenticated',
      user,
      token: 'token-1',
    })
  })

  it('clears the user and token when authentication is rejected', () => {
    const authenticatedState: AuthState = {
      status: 'authenticated',
      user,
      token: 'token-1',
    }

    expect(
      transitionAuthState(authenticatedState, { type: 'AUTH_REJECTED' }),
    ).toEqual({
      status: 'unauthenticated',
      user: null,
      token: null,
    })
  })

  it('keeps the token when the server is unavailable', () => {
    const authenticatedState: AuthState = {
      status: 'authenticated',
      user,
      token: 'token-1',
    }

    expect(
      transitionAuthState(authenticatedState, {
        type: 'SERVER_UNAVAILABLE',
      }),
    ).toEqual({
      status: 'unavailable',
      user: null,
      token: 'token-1',
    })
  })

  it('supports unavailable mode without a token', () => {
    expect(
      transitionAuthState(initialAuthState(), {
        type: 'SERVER_UNAVAILABLE',
      }),
    ).toEqual({
      status: 'unavailable',
      user: null,
      token: null,
    })
  })

  it('clears the user and token on logout', () => {
    const authenticatedState: AuthState = {
      status: 'authenticated',
      user,
      token: 'token-1',
    }

    expect(
      transitionAuthState(authenticatedState, { type: 'LOGOUT' }),
    ).toEqual({
      status: 'unauthenticated',
      user: null,
      token: null,
    })
  })

  it('does not mutate the input state', () => {
    const authenticatedState: AuthState = {
      status: 'authenticated',
      user,
      token: 'token-1',
    }

    const nextState = transitionAuthState(authenticatedState, {
      type: 'SERVER_UNAVAILABLE',
    })

    expect(authenticatedState).toEqual({
      status: 'authenticated',
      user,
      token: 'token-1',
    })
    expect(nextState).not.toBe(authenticatedState)
  })
})
