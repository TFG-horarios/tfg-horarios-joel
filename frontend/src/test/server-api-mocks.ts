import { vi } from 'vitest';

type ApiMethodName = '$delete' | '$get' | '$patch' | '$post' | '$put';

type QueuedResponse = {
  ok?: boolean;
  status?: number;
  payload?: unknown;
};

type RequestRecord = {
  method: ApiMethodName;
  input: unknown;
};

type TranslateValues = Record<string, string | number>;

const methodNames = new Set<PropertyKey>([
  '$delete',
  '$get',
  '$patch',
  '$post',
  '$put',
]);

const isApiMethodName = (property: PropertyKey): property is ApiMethodName =>
  methodNames.has(property);

const responses: QueuedResponse[] = [];
const requests: RequestRecord[] = [];

function createResponse({
  ok = true,
  status = ok ? 200 : 500,
  payload = {},
}: QueuedResponse): Response {
  return {
    ok,
    status,
    json: async () => payload,
  } as unknown as Response;
}

function createApiProxy(): Record<PropertyKey, unknown> {
  const proxy = new Proxy<Record<PropertyKey, unknown>>(
    {},
    {
      get(_target, property) {
        if (isApiMethodName(property)) {
          return (input: unknown) => {
            requests.push({ method: property, input });
            return Promise.resolve(createResponse(responses.shift() ?? {}));
          };
        }

        return proxy;
      },
    }
  );

  return proxy;
}

const apiProxy = createApiProxy();

export const getServerClientMock = vi.fn(async () => ({
  api: apiProxy,
}));

export const revalidatePathMock = vi.fn();
export const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});

export const setAuthSessionMock = vi.fn(async () => undefined);
export const clearAuthSessionMock = vi.fn(async () => undefined);

export const cookiesMock = vi.fn(async () => ({
  get: () => ({ value: 'auth-token' }),
}));

export const getTranslationsMock = vi.fn(async (namespace: string) => {
  const translate = (key: string, values?: TranslateValues) => {
    const suffix = values ? ` ${Object.values(values).join(', ')}` : '';
    return `${namespace}.${key}${suffix}`;
  };

  translate.rich = translate;

  return translate;
});

export function queueResponses(...queuedResponses: QueuedResponse[]) {
  responses.push(...queuedResponses);
}

export function getApiRequests() {
  return requests;
}

export function resetServerApiMocks() {
  responses.splice(0);
  requests.splice(0);
  getServerClientMock.mockClear();
  revalidatePathMock.mockClear();
  redirectMock.mockClear();
  setAuthSessionMock.mockClear();
  clearAuthSessionMock.mockClear();
  cookiesMock.mockClear();
  getTranslationsMock.mockClear();
}
