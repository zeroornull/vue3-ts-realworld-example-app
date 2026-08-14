import { describe, expect, it } from 'bun:test'
import { getSafeRedirect } from '../src/router/redirect'

describe('getSafeRedirect', () => {
  it('accepts internal paths', () => {
    expect(getSafeRedirect('/article/demo')).toBe('/article/demo')
  })

  it('rejects absolute and protocol-relative redirects', () => {
    expect(getSafeRedirect('https://example.com')).toBe('/')
    expect(getSafeRedirect('//example.com')).toBe('/')
    expect(getSafeRedirect(null)).toBe('/')
  })
})
