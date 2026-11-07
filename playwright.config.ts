import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: '*.spec.ts',
  fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', testIgnore: 'assets.spec.ts', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', testIgnore: 'assets.spec.ts', use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, defaultBrowserType: 'chromium' } },
    { name: 'standalone', testMatch: 'assets.spec.ts', use: { baseURL: 'http://127.0.0.1:5174/' } },
    { name: 'proxy', testMatch: 'assets.spec.ts', use: { baseURL: 'http://127.0.0.1:5175/find-cats/' } },
  ],
  webServer: [
    { command: 'npm run dev -- --port 5173', url: 'http://127.0.0.1:5173/', reuseExistingServer: !process.env.CI },
    { command: 'npm run build && npm run preview -- --port 5174 --strictPort', url: 'http://127.0.0.1:5174/', reuseExistingServer: false },
    { command: 'node --experimental-strip-types tests/proxy.ts', url: 'http://127.0.0.1:5175/health', reuseExistingServer: false },
  ],
})
