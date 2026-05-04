import { type Context, type Next } from 'hono';
import { DomainException } from '../errors/domain.exception';

export const globalErrorMiddleware = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (err: any) {
    if (err instanceof DomainException) {
      return c.json(
        {
          message: err.message,
          error: 'Domain Error',
        },
        400
      );
    }

    console.error('Unhandled Exception:', err);
    return c.json(
      {
        message: 'Internal server error',
        error: err.message || 'Unknown',
      },
      500
    );
  }
};
