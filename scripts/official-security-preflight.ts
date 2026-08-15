import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const PUBLIC_API_HOST = 'api.realworld.show'
const DEFAULT_HEALTH_TIMEOUT_MS = 5_000

export type OfficialSecurityPreflightEnvironment = {
  API_MODE?: string
  API_BASE?: string
  OFFICIAL_E2E_ALLOW_MUTATIONS?: string
  OFFICIAL_E2E_CLEANUP_CONFIRMED?: string
}

export type OfficialSecurityPreflightOptions = {
  healthCheck?: boolean
  fetchImpl?: typeof fetch
  healthTimeoutMs?: number
}

export type OfficialSecurityPreflightResult = {
  ok: boolean
  apiBase: string | null
  errors: string[]
  healthChecked: boolean
}

function isTrue(value: string | undefined): boolean {
  return value?.toLowerCase() === 'true'
}

function parseApiBase(apiBase: string | undefined): URL | null {
  const value = apiBase?.trim()

  if (!value) {
    return null
  }

  try {
    const parsed = new URL(value)

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function officialSecurityPreflightErrors(
  environment: OfficialSecurityPreflightEnvironment,
): string[] {
  const errors: string[] = []

  if (!isTrue(environment.API_MODE)) {
    errors.push('set API_MODE=true for the direct-API official security suite.')
  }

  if (!isTrue(environment.OFFICIAL_E2E_ALLOW_MUTATIONS)) {
    errors.push(
      'set OFFICIAL_E2E_ALLOW_MUTATIONS=true to acknowledge test data mutations.',
    )
  }

  if (!isTrue(environment.OFFICIAL_E2E_CLEANUP_CONFIRMED)) {
    errors.push(
      'set OFFICIAL_E2E_CLEANUP_CONFIRMED=true after confirming test data cleanup.',
    )
  }

  const apiBase = environment.API_BASE?.trim()

  if (!apiBase) {
    errors.push('set API_BASE to a dedicated disposable RealWorld API.')
    return errors
  }

  const parsedApiBase = parseApiBase(apiBase)

  if (!parsedApiBase) {
    errors.push('API_BASE must be an absolute HTTP(S) URL.')
    return errors
  }

  if (parsedApiBase.hostname === PUBLIC_API_HOST) {
    errors.push('refusing to use the public api.realworld.show service.')
  }

  return errors
}

function healthUrl(apiBase: string): string {
  return `${apiBase.replace(/\/+$/, '')}/tags`
}

async function checkHealth(
  apiBase: string,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<string | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetchImpl(healthUrl(apiBase), {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: controller.signal,
    })

    if (!response.ok) {
      return `read-only health check returned HTTP ${response.status}.`
    }

    return null
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return `read-only health check failed: ${detail}`
  } finally {
    clearTimeout(timeout)
  }
}

export async function runOfficialSecurityPreflight(
  environment: OfficialSecurityPreflightEnvironment,
  options: OfficialSecurityPreflightOptions = {},
): Promise<OfficialSecurityPreflightResult> {
  const errors = officialSecurityPreflightErrors(environment)
  const apiBase = environment.API_BASE?.trim() || null

  if (errors.length > 0 || !apiBase || !options.healthCheck) {
    return {
      ok: errors.length === 0,
      apiBase,
      errors,
      healthChecked: false,
    }
  }

  const healthError = await checkHealth(
    apiBase,
    options.fetchImpl ?? fetch,
    options.healthTimeoutMs ?? DEFAULT_HEALTH_TIMEOUT_MS,
  )

  return {
    ok: healthError === null,
    apiBase,
    errors: healthError ? [healthError] : [],
    healthChecked: true,
  }
}

function hasHealthCheckFlag(argv: readonly string[]): boolean {
  return argv.includes('--health-check')
}

export async function runOfficialSecurityPreflightCli(
  argv: readonly string[],
  environment: OfficialSecurityPreflightEnvironment,
): Promise<number> {
  const result = await runOfficialSecurityPreflight(environment, {
    healthCheck: hasHealthCheckFlag(argv),
  })

  if (!result.ok) {
    console.error('[official-security-preflight] blocked:')
    for (const error of result.errors) {
      console.error(`- ${error}`)
    }
    return 1
  }

  console.log(
    `[official-security-preflight] ready for ${result.apiBase}${
      result.healthChecked ? ' (read-only health check passed)' : ''
    }`,
  )
  return 0
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1]

  return (
    entrypoint !== undefined &&
    pathToFileURL(resolve(entrypoint)).href === import.meta.url
  )
}

if (isDirectExecution()) {
  const exitCode = await runOfficialSecurityPreflightCli(
    process.argv.slice(2),
    process.env,
  )

  if (exitCode !== 0) {
    process.exitCode = exitCode
  }
}
