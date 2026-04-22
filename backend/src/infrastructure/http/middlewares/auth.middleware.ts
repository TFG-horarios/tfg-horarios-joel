import { Context, Next } from 'hono';
import { container, DI_TOKENS } from '../../di/container';
import { IJwtService } from '../../../application/services/jwt.service.interface';

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ message: 'Unauthorized' }, 401);
  }

  const token = authHeader.split(' ')[1];
  const jwtService = container.resolve<IJwtService>(DI_TOKENS.JwtService);
  const payload = await jwtService.verify(token);

  if (!payload) {
    return c.json({ message: 'Invalid or expired token' }, 401);
  }

  c.set('jwtPayload', payload);
  c.set('userId', payload.sub);

  await next();
};
