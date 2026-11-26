import { defineConfig } from '@playwright/test';

const previewUrl = process.env.IMMERSLIDES_PREVIEW_URL;
export default defineConfig({
  testDir: './tests/browser',
  use: {
    baseURL: previewUrl ?? 'http://127.0.0.1:5275',
    viewport: { width: 1600, height: 1000 },
  },
  webServer: previewUrl
    ? undefined
    : {
        command: 'pnpm dev --port 5275',
        url: 'http://127.0.0.1:5275',
        reuseExistingServer: false,
      },
  reporter: 'list',
});
