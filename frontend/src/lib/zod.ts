import type { ZodError } from 'zod';

export function getFieldErrors(error: ZodError) {
  const formatted = error.format();
  const fieldErrors: Record<string, string[]> = {};

  for (const key in formatted) {
    if (key !== '_errors') {
      fieldErrors[key] = formatted[key]?._errors || [];
    }
  }

  return fieldErrors;
}
