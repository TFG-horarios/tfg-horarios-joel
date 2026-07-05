import type { z } from 'zod';

const DEFAULT_API_URL = 'http://localhost:8080';

export function createApiEventSource(path: string): EventSource {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
  return new EventSource(`${baseUrl}${path}`, { withCredentials: true });
}

export function parseEventData<TSchema extends z.ZodType>(
  event: MessageEvent,
  schema: TSchema
): z.infer<TSchema> {
  return schema.parse(JSON.parse(event.data) as unknown);
}
