import { test as base, expect } from '@playwright/test';
import { E2EApi, type E2EUser } from './api';

type E2EFixtures = {
  api: E2EApi;
  runId: string;
  user: E2EUser;
};

function hashText(value: string) {
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash.toString(36);
}

export const test = base.extend<E2EFixtures>({
  runId: async ({ browserName }, use, testInfo) => {
    const titleHash = hashText(testInfo.title);
    const timestamp = Date.now().toString(36);

    await use(
      `${timestamp}-${testInfo.workerIndex}-${browserName}-${titleHash}`
    );
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
