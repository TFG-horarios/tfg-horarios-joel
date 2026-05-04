import { hc } from 'hono/client';
import { type AppType } from '@tfg-horarios/backend/src/index';
import { cookies } from 'next/headers';

const DEFAULT_API_URL = 'http://localhost:8080';

export const api = hc<AppType>(
  process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL,
  {
    fetch: async (
      input: string | Request | URL,
      requestInit: RequestInit | undefined
    ) => {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth-token')?.value;

      const headers = new Headers(requestInit?.headers);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      return fetch(input, { ...requestInit, headers });
    },
  }
);
