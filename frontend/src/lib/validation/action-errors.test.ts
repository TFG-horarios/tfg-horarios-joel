import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { zodErrorToActionErrors } from './action-errors';

describe('zodErrorToActionErrors', () => {
  it('returns field errors when validation fails on fields', () => {
    const result = z
      .object({ name: z.string().min(2, 'Name is too short') })
      .safeParse({ name: '' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(zodErrorToActionErrors(result.error)).toEqual({
        name: ['Name is too short'],
      });
    }
  });

  it('adds root errors when validation fails at form level', () => {
    const result = z
      .object({ start: z.number(), end: z.number() })
      .refine((value) => value.end > value.start, 'End must be later')
      .safeParse({ start: 10, end: 9 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(zodErrorToActionErrors(result.error)).toEqual({
        root: ['End must be later'],
      });
    }
  });
});
