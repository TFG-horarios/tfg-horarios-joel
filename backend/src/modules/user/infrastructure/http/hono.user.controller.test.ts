import { describe, expect, test, mock } from 'bun:test';
import type { AppEnv } from '@/core/types/app-types';
import { HonoUserController } from './hono.user.controller';
import { createTestApp } from '@/tests/setup-http';
import { NotFoundError } from '@/core/errors/app.error';
import { OpenAPIHono } from '@hono/zod-openapi';
import { getMeRoute, updateMeRoute } from './hono.user.routes';

describe('HonoUserController Integration', () => {
  const getByIdMock = { execute: mock() };
  const updateMock = { execute: mock() };
  const updatePasswordMock = { execute: mock() };
  const deleteMock = { execute: mock() };

  type Params = ConstructorParameters<typeof HonoUserController>;
  const controller = new HonoUserController(
    getByIdMock as unknown as Params[0],
    updateMock as unknown as Params[1],
    updatePasswordMock as unknown as Params[2],
    deleteMock as unknown as Params[3]
  );

  const router = new OpenAPIHono<AppEnv>();
  router.openapi(getMeRoute, controller.getMe);
  router.openapi(updateMeRoute, controller.updateMe);

  const app = createTestApp('/api', router, 'u-1');

  test('GET /users/me should return 200 with user', async () => {
    getByIdMock.execute.mockResolvedValueOnce({
      id: 'u-1',
      name: 'John',
      email: 'j@e.com',
    });
    const res = await app.request('/api/users/me');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: 'u-1',
      name: 'John',
      email: 'j@e.com',
    });
    expect(getByIdMock.execute).toHaveBeenCalledWith('u-1');
  });

  test('GET /users/me should return 404 if AppError thrown', async () => {
    getByIdMock.execute.mockRejectedValueOnce(new NotFoundError('User', 'u-1'));
    const res = await app.request('/api/users/me');
    expect(res.status).toBe(404);
  });

  test('PATCH /users/me should return 400 for invalid body', async () => {
    const res = await app.request('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    });
    expect(res.status).toBe(400);
  });
});
