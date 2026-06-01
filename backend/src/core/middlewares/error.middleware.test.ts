import { describe, expect, test, mock } from 'bun:test';
import { globalErrorMiddleware } from './error.middleware';
import { AppError } from '../errors/app.error';
import { ZodError } from 'zod';
import type { Context } from 'hono';

describe('GlobalErrorMiddleware', () => {
  test('handles AppError', () => {
    const error = new AppError('app error', 400);
    const c = { json: mock() } as never as Context;
    globalErrorMiddleware(error, c);
    expect(c.json).toHaveBeenCalledWith(
      { status: 'error', message: 'app error', type: 'AppError' },
      400
    );
  });

  test('handles ZodError', () => {
    const error = new ZodError([]);
    const c = { json: mock() } as never as Context;
    globalErrorMiddleware(error, c);
    expect(c.json).toHaveBeenCalledWith(
      { status: 'error', message: 'Validation Failed', errors: [] },
      400
    );
  });

  test('handles unknown error', () => {
    const error = new Error('unknown');
    const c = { json: mock() } as never as Context;
    globalErrorMiddleware(error, c);
    expect(c.json).toHaveBeenCalledWith(
      { message: 'Internal Server Error' },
      500
    );
  });
});
