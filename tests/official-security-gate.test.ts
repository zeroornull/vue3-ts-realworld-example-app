import { expect, test } from 'bun:test'
import { officialSecurityGateError } from '../scripts/official-security-gate'

const officialArgs = ['playwright', '--grep', '@security']

test('keeps official discovery available without enabling mutations', () => {
  expect(officialSecurityGateError([...officialArgs, '--list'], {})).toBeNull()
})

test('allows route-mocked official tests when API mode is disabled', () => {
  expect(
    officialSecurityGateError(officialArgs, { API_MODE: 'false' }),
  ).toBeNull()
})

test('requires explicit mutation and cleanup acknowledgements', () => {
  const error = officialSecurityGateError(officialArgs, {
    API_BASE: 'https://dedicated.example.test/api',
  })

  expect(error).toContain('OFFICIAL_E2E_ALLOW_MUTATIONS=true')
})

test('rejects the public API and accepts a disposable HTTPS API', () => {
  const acknowledged = {
    OFFICIAL_E2E_ALLOW_MUTATIONS: 'true',
    OFFICIAL_E2E_CLEANUP_CONFIRMED: 'true',
  }

  expect(
    officialSecurityGateError(officialArgs, {
      ...acknowledged,
      API_BASE: 'https://api.realworld.show/api',
    }),
  ).toContain('refusing to run')

  expect(
    officialSecurityGateError(officialArgs, {
      ...acknowledged,
      API_BASE: 'https://dedicated.example.test/api',
    }),
  ).toBeNull()
})
