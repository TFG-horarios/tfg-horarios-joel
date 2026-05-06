import { type Context, type Next } from 'hono';
import { type ITokenService } from '../../modules/auth/domain/token.service';
import { UnauthorizedError } from '../errors/app.error';

export const createAuthMiddleware = (tokenService: ITokenService) => {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1] || '';
    const payload = await tokenService.validate(token);
    if (!payload) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    c.set('jwtPayload', payload);
    c.set('userId', payload.id);

    await next();
  };
};
