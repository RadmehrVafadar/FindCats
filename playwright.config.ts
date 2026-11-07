import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: '*.spec.ts',
  fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, defaultBrowserType: 'chromium' } },
  ],
  webServer: { command: 'npm run dev -- --port 5173', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI },
})
