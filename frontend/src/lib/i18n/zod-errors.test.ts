import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useZodErrorMap } from './zod-errors';

const getMessage = (mapped: string | { message: string } | null | undefined) =>
  typeof mapped === 'string' ? mapped : (mapped?.message ?? '');

describe('useZodErrorMap', () => {
  it('translates issue codes with the field path', () => {
    const { result } = renderHook(() => useZodErrorMap());
    const errorMap = result.current;

    const message = getMessage(
      errorMap({
        code: 'invalid_type',
        expected: 'string',
        input: 1,
        path: ['name'],
        message: 'Invalid input',
      })
    );

    expect(message).toBe('invalid_type name');
  });

  it('uses custom issue messages as translation keys', () => {
    const { result } = renderHook(() => useZodErrorMap());
    const errorMap = result.current;

    const message = getMessage(
      errorMap({
        code: 'custom',
        input: undefined,
        path: [],
        message: 'passwords_mismatch',
      })
    );

    expect(message).toBe('passwords_mismatch');
  });
});
