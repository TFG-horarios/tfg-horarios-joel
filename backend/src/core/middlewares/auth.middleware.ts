import { type Context, type Next } from 'hono';
import { type IJwtService } from '../../modules/auth/domain/jwt.service.interface';

export const createAuthMiddleware = (jwtService: IJwtService) => {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const token = authHeader.split(' ')[1] || '';

    try {
      const payload = await jwtService.verify(token);

      if (!payload) {
        return c.json({ message: 'Invalid or expired token' }, 401);
      }

      c.set('jwtPayload', payload);
      c.set('userId', payload.sub);

      await next();
    } catch (error) {
      return c.json(
        { message: `Invalid or expired token. The error was: ${error}` },
        401
      );
    }
  };
};
