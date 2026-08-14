import { describe, expect, it } from 'bun:test'
import type { User } from '../types/realworld'
import {
  createAuthenticatedState,
  createAuthStateFromToken,
  createUnauthenticatedState,
  createUnavailableState,
} from './auth-state'

const demoUser: User = {
  email: 'learner@example.com',
  token: 'demo-token',
  username: 'local-learner',
  bio: null,
  image: null,
}

describe('auth state transitions', () => {
  it('treats a missing token as unauthenticated', () => {
    expect(createAuthStateFromToken(null)).toEqual({
      status: 'unauthenticated',
      token: null,
      user: null,
      errors: {},
    })
  })

  it('restores a local token without inventing a user', () => {
    expect(createAuthStateFromToken('saved-token')).toEqual({
      status: 'loading',
      token: 'saved-token',
      user: null,
      errors: {},
    })
  })

  it('returns new states without mutating its inputs', () => {
    const initial = createAuthStateFromToken(null)
    const initialSnapshot = structuredClone(initial)
    const userSnapshot = structuredClone(demoUser)

    const authenticated = createAuthenticatedState(initial, demoUser)
    const authenticatedSnapshot = structuredClone(authenticated)
    const unavailable = createUnavailableState(authenticated)
    const loggedOut = createUnauthenticatedState(authenticated)

    expect(initial).toEqual(initialSnapshot)
    expect(demoUser).toEqual(userSnapshot)
    expect(authenticated).toEqual(authenticatedSnapshot)
    expect(authenticated).not.toBe(initial)
    expect(unavailable).not.toBe(authenticated)
    expect(unavailable).toEqual({
      status: 'unavailable',
      token: demoUser.token,
      user: null,
      errors: {},
    })
    expect(loggedOut).not.toBe(authenticated)
    expect(loggedOut).toEqual({
      status: 'unauthenticated',
      token: null,
      user: null,
      errors: {},
    })
  })
})
