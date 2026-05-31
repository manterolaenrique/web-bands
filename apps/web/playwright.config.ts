import {defineConfig, devices} from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3100'
const useManagedWebServer = !process.env.PLAYWRIGHT_BASE_URL
const managedWebServerCommand =
  'npm run build && npm run start -- --hostname localhost --port 3100'
const useVercelProtectionState =
  Boolean(process.env.PLAYWRIGHT_VERCEL_SHARE_URL) ||
  Boolean(process.env.PLAYWRIGHT_VERCEL_PROTECTION_BYPASS_TOKEN)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  globalSetup: './e2e/global.setup.ts',
  reporter: 'list',
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  workers: process.env.CI ? 1 : undefined,
  webServer: useManagedWebServer
    ? {
        command: managedWebServerCommand,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 300_000,
      }
    : undefined,
  use: {
    baseURL,
    storageState: useVercelProtectionState ? './e2e/.generated/vercel-protection-state.json' : undefined,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
})
