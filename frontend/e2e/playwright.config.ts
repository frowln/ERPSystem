import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E and smoke tests.
 *
 * Run with:
 *   npx playwright test
 *   npx playwright test e2e/smoke/
 *
 * See: https://playwright.dev/docs/test-configuration
 */
const baseURL = process.env.BASE_URL || 'http://localhost:3000';
const shouldStartLocalDevServer = !process.env.CI
  && !process.env.BASE_URL
  && process.env.PLAYWRIGHT_USE_EXISTING_SERVER !== 'true';

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    // Authentication setup -- runs before other tests
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // Smoke tests run in Chromium only for speed
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  // Start the dev server automatically when running locally
  webServer: shouldStartLocalDevServer
    ? {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 30_000,
      }
    : undefined,
});
