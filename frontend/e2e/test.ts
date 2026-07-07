import { test as base, expect } from '@playwright/test';
import { E2EApi, type E2EUser } from './api';

type E2EFixtures = {
  api: E2EApi;
  runId: string;
  user: E2EUser;
};

export const test = base.extend<E2EFixtures>({
  runId: async ({ browserName }, use, testInfo) => {
    const safeTitle = testInfo.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    await use(`${Date.now()}-${testInfo.workerIndex}-${browserName}-${safeTitle}`);
  },
  api: async ({ request }, use) => {
    await use(
      new E2EApi(request, process.env.E2E_API_URL ?? 'http://127.0.0.1:8080')
    );
  },
  user: async ({ api, runId }, use) => {
    const user = await api.registerUser(runId);
    await use(user);
  },
});

export { expect };
