import { describe, expect, test, mock } from 'bun:test';
import { HonoAuthController } from './hono.auth.controller';
import { createTestApp } from '@/tests/setup-http';
import { UnauthorizedError } from '@/core/errors/app.error';
import { OpenAPIHono } from '@hono/zod-openapi';
import { loginRoute, registerRoute } from './hono.auth.routes';
import type { AppEnv } from '@/core/types/app-types';

describe('HonoAuthController Integration', () => {
  const loginMock = { execute: mock() };
  const registerMock = { execute: mock() };

  type Params = ConstructorParameters<typeof HonoAuthController>;
  const controller = new HonoAuthController(
    loginMock as unknown as Params[0],
    registerMock as unknown as Params[1]
  );

  const router = new OpenAPIHono<AppEnv>();
  router.openapi(loginRoute, controller.login);
  router.openapi(registerRoute, controller.register);

  const app = createTestApp('/api', router);

  test('POST /auth/login should return 200 and set cookie', async () => {
    loginMock.execute.mockResolvedValueOnce({
      user: { id: 'u-1', name: 'John', email: 'j@e.com' },
      token: 'valid-jwt-token',
    });
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'j@e.com', password: 'password123' }),
    });
    expect(res.status).toBe(200);
    const setCookieHeader = res.headers.get('set-cookie');
    expect(setCookieHeader).toContain('auth-token=valid-jwt-token');
    expect(await res.json()).toEqual({
      user: { id: 'u-1', name: 'John', email: 'j@e.com' },
      token: 'valid-jwt-token',
    });
  });

  test('POST /auth/login should return 401 on UnauthorizedError', async () => {
    loginMock.execute.mockRejectedValueOnce(
      new UnauthorizedError('Invalid credentials')
    );
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'j@e.com', password: 'wrong-password' }),
    });
    expect(res.status).toBe(401);
  });

  test('POST /auth/login should return 400 for invalid body', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    });

    expect(res.status).toBe(400);
  });

  test('POST /auth/register should return 201 and set cookie', async () => {
    registerMock.execute.mockResolvedValueOnce({
      user: { id: 'u-2', name: 'Jane', email: 'jane@e.com' },
      token: 'new-jwt-token',
    });
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane',
        email: 'jane@e.com',
        password: 'password123',
      }),
    });
    expect(res.status).toBe(201);
    expect(res.headers.get('set-cookie')).toContain('auth-token=new-jwt-token');
  });
});
