import { type Context, type Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { type ITokenService } from '@/modules/auth/domain/token.service';
import { UnauthorizedError } from '../errors/app.error';

export const createAuthMiddleware = (tokenService: ITokenService) => {
  return async (c: Context, next: Next) => {
    let token;

    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1] || '';
    } else {
      token = getCookie(c, 'auth-token') || '';
    }

    if (!token) {
      throw new UnauthorizedError('Missing or invalid authentication token');
    }
    const payload = await tokenService.validate(token);
    if (!payload) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    c.set('jwtPayload', payload);
    c.set('userId', payload.id);

    await next();
  };
};
