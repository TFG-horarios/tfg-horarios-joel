import { defineConfig } from '@playwright/test';

const isCI = !!process.env.CI;
const frontendPort = Number(process.env.E2E_FRONTEND_PORT ?? 3100);
const backendPort = Number(process.env.E2E_BACKEND_PORT ?? 8080);
const frontendUrl =
  process.env.E2E_BASE_URL ?? `http://127.0.0.1:${frontendPort}`;
const backendUrl = process.env.E2E_API_URL ?? `http://127.0.0.1:${backendPort}`;
const localChromiumExecutable =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
  '/usr/bin/chromium-browser';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: 1,
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: frontendUrl,
    trace: 'on-first-retry',
    video: 'off',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'bun run --cwd ../backend dev',
      url: `${backendUrl}/healthz`,
      reuseExistingServer: !isCI,
      timeout: 120_000,
      env: {
        JWT_SECRET: process.env.JWT_SECRET ?? 'e2e-secret',
        JWT_EXPIRES_IN_SECONDS: process.env.JWT_EXPIRES_IN_SECONDS ?? '86400',
        FRONTEND_URL: frontendUrl,
        COOKIE_SECURE: 'false',
        SERVER_IDLE_TIMEOUT_SECONDS: '255',
        ...process.env,
      },
    },
    {
      command: isCI
        ? 'node .next/standalone/frontend/server.js'
        : `bun run dev -- --hostname 127.0.0.1 --port ${frontendPort}`,
      url: frontendUrl,
      reuseExistingServer: !isCI,
      timeout: 120_000,
      env: {
        HOSTNAME: '127.0.0.1',
        PORT: String(frontendPort),
        NEXT_PUBLIC_API_URL: backendUrl,
        INTERNAL_API_URL: backendUrl,
        COOKIE_SECURE: 'false',
        NEXT_TELEMETRY_DISABLED: '1',
        ...process.env,
      },
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: {
        launchOptions: isCI
          ? undefined
          : {
              executablePath: localChromiumExecutable,
            },
      },
    },
  ],
});
