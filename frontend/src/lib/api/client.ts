import { hc } from 'hono/client';
import type { AppType } from '@tfg-horarios/backend/src/index';

const DEFAULT_API_URL = 'http://localhost:8080';

export const apiClient = hc<AppType>(
  process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL
);
