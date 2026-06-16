import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

/**
 * Microsoft Enterprise-Grade E2E Configuration
 * @see https://playwright.dev/docs/test-configuration
 *
 * Browser selection is env-driven so the suite runs cleanly in environments
 * where only Chromium is installed (the default). To run more browsers:
 *   PW_BROWSERS=chromium,firefox,webkit npx playwright test
 */
const REQUESTED_BROWSERS = (process.env.PW_BROWSERS || 'chromium')
  .split(',')
  .map((b) => b.trim())
  .filter(Boolean);

const ALL_PROJECTS = [
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      permissions: ['camera', 'microphone'] as ('camera' | 'microphone')[],
    },
  },
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
  },
  {
    name: 'webkit',
    use: { ...devices['Desktop Safari'] },
  },
];

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:5173',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    /* Fake media devices for testing */
    launchOptions: {
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--allow-file-access',
      ],
    },

    /* Viewport */
    viewport: { width: 1920, height: 1080 },
  },

  /* Only configure the browsers that were requested (and are installed). */
  projects: ALL_PROJECTS.filter((p) => REQUESTED_BROWSERS.includes(p.name)),

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: process.env.BASE_URL || 'http://localhost:5173',
    reuseExistingServer: true, // Always reuse - works on any port
    timeout: 120000,
  },
});
