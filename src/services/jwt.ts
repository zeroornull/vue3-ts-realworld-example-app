export const JWT_TOKEN_KEY = 'jwtToken'

export type TokenStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function getBrowserStorage(): TokenStorage | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function readToken(
  storage: TokenStorage | null = getBrowserStorage(),
): string | null {
  if (!storage) {
    return null
  }

  try {
    const token: unknown = storage.getItem(JWT_TOKEN_KEY)

    if (typeof token !== 'string') {
      return null
    }

    return token.trim() || null
  } catch {
    return null
  }
}

export function saveToken(
  token: string,
  storage: TokenStorage | null = getBrowserStorage(),
): void {
  if (!storage) {
    return
  }

  try {
    if (token.trim()) {
      storage.setItem(JWT_TOKEN_KEY, token)
    } else {
      storage.removeItem(JWT_TOKEN_KEY)
    }
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

export function removeToken(
  storage: TokenStorage | null = getBrowserStorage(),
): void {
  if (!storage) {
    return
  }

  try {
    storage.removeItem(JWT_TOKEN_KEY)
  } catch {
    // Logging out should still clear in-memory state when storage is unavailable.
  }
}
