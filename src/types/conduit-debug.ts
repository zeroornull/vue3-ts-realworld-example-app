import type { AuthStatus } from '../stores/auth-state'
import type { User } from './realworld'

export type ConduitDebug = {
  getToken: () => string | null
  getAuthState: () => AuthStatus
  getCurrentUser: () => User | null
}

declare global {
  interface Window {
    __conduit_debug__?: ConduitDebug
  }
}
