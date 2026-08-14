import { defineConfig } from '@playwright/test'
import { baseConfig } from './realworld/specs/e2e/playwright.base.ts'

const baseURL = 'http://127.0.0.1:4173'

export default defineConfig({
  ...baseConfig,
  testDir: './tests/e2e',
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
