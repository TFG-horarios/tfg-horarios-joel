import { describe, expect, test, mock } from 'bun:test';
import { createAuthMiddleware } from './auth.middleware';
import { UnauthorizedError } from '../errors/app.error';
import type { Context } from 'hono';

describe('AuthMiddleware', () => {
  const tokenServiceMock = { validate: mock(), generate: mock() };
  const middleware = createAuthMiddleware(tokenServiceMock);

  test('throws Unauthorized if no header', async () => {
    const c = {
      req: {
        header: () => undefined,
        raw: { headers: { get: () => null } },
      },
    } as never as Context;
    expect(middleware(c, async () => {})).rejects.toThrow(UnauthorizedError);
  });

  test('throws Unauthorized if invalid header format', async () => {
    const c = {
      req: {
        header: () => 'InvalidFormat token',
        raw: { headers: { get: () => null } },
      },
    } as never as Context;
    expect(middleware(c, async () => {})).rejects.toThrow(UnauthorizedError);
  });

  test('throws Unauthorized if token invalid', async () => {
    const c = {
      req: { header: () => 'Bearer invalid_token' },
    } as never as Context;
    tokenServiceMock.validate.mockResolvedValueOnce(null);
    expect(middleware(c, async () => {})).rejects.toThrow(UnauthorizedError);
  });

  test('sets context and calls next if token valid', async () => {
    const c = {
      req: { header: () => 'Bearer valid_token' },
      set: mock(),
    } as never as Context;
    const payload = { id: 'u-1', name: 'John', email: 'j@e.com' };
    tokenServiceMock.validate.mockResolvedValueOnce(payload);
    let nextCalled = false;
    const next = async () => {
      nextCalled = true;
    };
    await middleware(c, next);
    expect(nextCalled).toBeTrue();
    expect(c.set).toHaveBeenCalledWith('jwtPayload', payload);
    expect(c.set).toHaveBeenCalledWith('userId', 'u-1');
  });
});
