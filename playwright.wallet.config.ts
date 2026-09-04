import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/wallet',
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'pnpm dev --port 5174 --strictPort',
    env: {
      VITE_TONCONNECT_MANIFEST_URL:
        'https://sweepdock.test/tonconnect-manifest.json',
    },
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: false,
  },
});
