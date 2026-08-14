import { defineConfig } from '@playwright/test'
import { baseConfig } from './realworld/specs/e2e/playwright.base.ts'

const baseURL = 'http://127.0.0.1:4173'

/**
 * Discovery-only entry point for the upstream RealWorld suite.
 *
 * Keep the runnable local suite in playwright.config.ts. The upstream tests
 * create and mutate API data, so this config is intentionally exposed through
 * the `test:e2e:official:list` script before we opt into execution.
 */
export default defineConfig({
  ...baseConfig,
  testDir: './realworld/specs/e2e',
  use: {
    ...baseConfig.use,
    baseURL,
  },
  webServer: {
    command: 'bunx vite --host 127.0.0.1 --port 4173 --strictPort',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
