import type { Context, ErrorHandler } from 'hono';
import { AppError } from '../errors/app.error';
import { ZodError } from 'zod';

export const globalErrorMiddleware: ErrorHandler = (err, c: Context) => {
  if (err instanceof AppError) {
    return c.json(
      {
        status: 'error',
        message: err.message,
        type: err.name,
      },
      err.statusCode
    );
  }
  if (err instanceof ZodError) {
    return c.json(
      {
        status: 'error',
        message: 'Validation Failed',
        errors: err.issues,
      },
      400
    );
  }
  return c.json({ message: 'Internal Server Error' }, 500);
};
