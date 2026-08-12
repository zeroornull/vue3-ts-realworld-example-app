import type { User } from './domain'
export type AuthStatus = 'authenticated' | 'unauthenticated' | 'unavailable'

export type AuthState = {
  status: AuthStatus
  user: User | null
  token: string | null
}

export type AuthEvent =
  | { type: 'TOKEN_MISSING' }
  | { type: 'AUTH_SUCCESS'; user: User }
  | { type: 'AUTH_REJECTED' }
  | { type: 'SERVER_UNAVAILABLE' }
  | { type: 'LOGOUT' }

function assertNever(value: never): never {
  throw new Error('Unhandled auth event: ' + JSON.stringify(value))
}

export function initialAuthState(): AuthState {
  return {
    status: 'unauthenticated',
    user: null,
    token: null,
  }
}

export function transitionAuthState(
  state: AuthState,
  event: AuthEvent,
): AuthState {
  switch (event.type) {
    case 'TOKEN_MISSING':
      return {
        status: 'unauthenticated',
        user: null,
        token: null,
      }

    case 'AUTH_SUCCESS':
      return {
        status: 'authenticated',
        user: event.user,
        token: event.user.token,
      }

    case 'AUTH_REJECTED':
      return {
        status: 'unauthenticated',
        user: null,
        token: null,
      }

    case 'SERVER_UNAVAILABLE':
      return {
        status: 'unavailable',
        user: null,
        token: state.token,
      }

    case 'LOGOUT':
      return {
        status: 'unauthenticated',
        user: null,
        token: null,
      }

    default:
      return assertNever(event)
  }
}
