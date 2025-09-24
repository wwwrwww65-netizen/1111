import { defineConfig } from '@playwright/test';

export default defineConfig({
  webServer: {
    command: 'pnpm preview',
    url: 'http://localhost:3002',
    reuseExistingServer: true,
    timeout: 60_000,
  },
  testDir: './tests',
});

