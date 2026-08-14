import { describe, expect, it } from 'bun:test'
import {
  JWT_TOKEN_KEY,
  readToken,
  removeToken,
  saveToken,
  type TokenStorage,
} from '../src/services/jwt'

function createMemoryStorage(initialToken: string | null = null): {
  storage: TokenStorage
  values: Map<string, string>
} {
  const values = new Map<string, string>()

  if (initialToken !== null) {
    values.set(JWT_TOKEN_KEY, initialToken)
  }

  return {
    values,
    storage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => void values.delete(key),
    },
  }
}

describe('JWT storage', () => {
  it('uses the exact jwtToken key for save, read, and remove', () => {
    const { storage, values } = createMemoryStorage()

    saveToken('saved-token', storage)
    expect(values.get('jwtToken')).toBe('saved-token')
    expect(readToken(storage)).toBe('saved-token')

    removeToken(storage)
    expect(values.has('jwtToken')).toBe(false)
  })

  it('treats blank or unavailable storage as no token', () => {
    const { storage } = createMemoryStorage('   ')
    const brokenStorage: TokenStorage = {
      getItem: () => {
        throw new Error('storage unavailable')
      },
      setItem: () => {
        throw new Error('storage unavailable')
      },
      removeItem: () => {
        throw new Error('storage unavailable')
      },
    }

    expect(readToken(storage)).toBeNull()
    expect(readToken(brokenStorage)).toBeNull()
    expect(() => saveToken('token', brokenStorage)).not.toThrow()
    expect(() => removeToken(brokenStorage)).not.toThrow()
  })
})
