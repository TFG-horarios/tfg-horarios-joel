import { hc } from 'hono/client';
import { cookies } from 'next/headers';
import { cache } from 'react';
import type { AppType } from '@tfg-horarios/backend/src/index';

const DEFAULT_API_URL = 'http://localhost:8080';

export const getServerClient = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  return hc<AppType>(process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
});
