import { defineConfig, devices } from '@playwright/test';

// Browser selection is env-driven (default: chromium only). To add WebKit:
//   PW_BROWSERS=chromium,webkit npx playwright test -c playwright.whiteboard.config.ts
const REQUESTED_BROWSERS = (process.env.PW_BROWSERS || 'chromium')
  .split(',')
  .map((b) => b.trim())
  .filter(Boolean);

const ALL_PROJECTS = [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
];

export default defineConfig({
  testDir: './tests/whiteboard/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report-whiteboard' }]],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: ALL_PROJECTS.filter((p) => REQUESTED_BROWSERS.includes(p.name)),

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
