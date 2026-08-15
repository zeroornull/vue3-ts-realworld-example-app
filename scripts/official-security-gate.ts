import type { FullConfig } from '@playwright/test'

const PUBLIC_API_HOST = 'api.realworld.show'

export type OfficialSecurityEnvironment = {
  API_MODE?: string
  API_BASE?: string
  OFFICIAL_E2E_ALLOW_MUTATIONS?: string
  OFFICIAL_E2E_CLEANUP_CONFIRMED?: string
}

function isDiscoveryOnly(argv: readonly string[]): boolean {
  return argv.includes('--list')
}

export function officialSecurityGateError(
  argv: readonly string[],
  environment: OfficialSecurityEnvironment,
): string | null {
  if (isDiscoveryOnly(argv)) {
    return null
  }

  if (environment.API_MODE?.toLowerCase() === 'false') {
    return null
  }

  if (environment.OFFICIAL_E2E_ALLOW_MUTATIONS !== 'true') {
    return 'set OFFICIAL_E2E_ALLOW_MUTATIONS=true to acknowledge test data mutations.'
  }

  if (environment.OFFICIAL_E2E_CLEANUP_CONFIRMED !== 'true') {
    return 'set OFFICIAL_E2E_CLEANUP_CONFIRMED=true after confirming test data cleanup.'
  }

  const apiBase = environment.API_BASE?.trim()

  if (!apiBase) {
    return 'set API_BASE to a dedicated disposable RealWorld API.'
  }

  let parsedApiBase: URL

  try {
    parsedApiBase = new URL(apiBase)
  } catch {
    return 'API_BASE must be an absolute HTTP(S) URL.'
  }

  if (!['http:', 'https:'].includes(parsedApiBase.protocol)) {
    return 'API_BASE must be an absolute HTTP(S) URL.'
  }

  if (parsedApiBase.hostname === PUBLIC_API_HOST) {
    return 'refusing to run mutating security tests against api.realworld.show.'
  }

  return null
}

export default async function officialSecurityGate(
  _config: FullConfig,
): Promise<void> {
  const error = officialSecurityGateError(process.argv, process.env)

  if (error) {
    throw new Error(`[official-security-gate] ${error}`)
  }
}
