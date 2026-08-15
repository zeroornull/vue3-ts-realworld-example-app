import { expect, test } from 'bun:test'
import {
  officialSecurityPreflightErrors,
  runOfficialSecurityPreflight,
} from '../scripts/official-security-preflight'

const acknowledged = {
  API_MODE: 'true',
  OFFICIAL_E2E_ALLOW_MUTATIONS: 'true',
  OFFICIAL_E2E_CLEANUP_CONFIRMED: 'true',
}

test('blocks a missing API_BASE before any request can run', async () => {
  let requestCount = 0

  const result = await runOfficialSecurityPreflight(acknowledged, {
    healthCheck: true,
    fetchImpl: async () => {
      requestCount += 1
      throw new Error('network should not be called')
    },
  })

  expect(result.ok).toBe(false)
  expect(result.errors).toContain(
    'set API_BASE to a dedicated disposable RealWorld API.',
  )
  expect(requestCount).toBe(0)
})

test('rejects the public API even when all confirmations are present', () => {
  const errors = officialSecurityPreflightErrors({
    ...acknowledged,
    API_BASE: 'https://api.realworld.show/api',
  })

  expect(errors).toContain(
    'refusing to use the public api.realworld.show service.',
  )
})

test('requires API_MODE=true instead of the route-mocked mode', () => {
  const errors = officialSecurityPreflightErrors({
    ...acknowledged,
    API_BASE: 'https://dedicated.example.test/api',
    API_MODE: 'false',
  })

  expect(errors).toContain(
    'set API_MODE=true for the direct-API official security suite.',
  )
})

test('accepts a dedicated HTTPS API without performing a request by default', async () => {
  let requestCount = 0

  const result = await runOfficialSecurityPreflight(
    {
      ...acknowledged,
      API_BASE: 'https://dedicated.example.test/api',
    },
    {
      fetchImpl: async () => {
        requestCount += 1
        throw new Error('network should not be called')
      },
    },
  )

  expect(result).toEqual({
    ok: true,
    apiBase: 'https://dedicated.example.test/api',
    errors: [],
    healthChecked: false,
  })
  expect(requestCount).toBe(0)
})

test('health check is opt-in and uses a read-only GET endpoint', async () => {
  const requests: Array<{ url: string; method: string | undefined }> = []

  const result = await runOfficialSecurityPreflight(
    {
      ...acknowledged,
      API_BASE: 'https://dedicated.example.test/api/',
    },
    {
      healthCheck: true,
      fetchImpl: async (input, init) => {
        requests.push({ url: String(input), method: init?.method })
        return new Response(JSON.stringify({ tags: [] }), { status: 200 })
      },
    },
  )

  expect(result.ok).toBe(true)
  expect(result.healthChecked).toBe(true)
  expect(requests).toEqual([
    {
      url: 'https://dedicated.example.test/api/tags',
      method: 'GET',
    },
  ])
})
