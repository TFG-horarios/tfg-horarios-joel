import { describe, expect, test, mock } from 'bun:test';
import type { AppEnv } from '@/core/types/app-types';
import { HonoNotificationController } from './hono.notification.controller';
import { createTestApp } from '@/tests/setup-http';
import { OpenAPIHono } from '@hono/zod-openapi';
import {
  listNotificationsRoute,
  markNotificationReadRoute,
  markAllNotificationsReadRoute,
} from './hono.notification.routes';

describe('HonoNotificationController Integration', () => {
  const listMock = { execute: mock() };
  const markReadMock = { execute: mock() };
  const markAllReadMock = { execute: mock() };

  type Params = ConstructorParameters<typeof HonoNotificationController>;
  const controller = new HonoNotificationController(
    listMock as unknown as Params[0],
    markReadMock as unknown as Params[1],
    markAllReadMock as unknown as Params[2]
  );

  const router = new OpenAPIHono<AppEnv>();
  router.openapi(listNotificationsRoute, controller.list);
  router.openapi(markNotificationReadRoute, controller.markAsRead);
  router.openapi(markAllNotificationsReadRoute, controller.markAllAsRead);

  const userId = '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a00';
  const notificationId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  const app = createTestApp('/api', router, userId);

  test('GET /users/:userId/notifications should return 200', async () => {
    listMock.execute.mockResolvedValueOnce({ data: [], meta: { total: 0 } });
    const res = await app.request(`/api/users/${userId}/notifications`);
    expect(res.status).toBe(200);
    expect(listMock.execute).toHaveBeenCalled();
  });

  test('PATCH /users/:userId/notifications/:id/read should return 200', async () => {
    markReadMock.execute.mockResolvedValueOnce({
      id: notificationId,
      isRead: true,
    });
    const res = await app.request(
      `/api/users/${userId}/notifications/${notificationId}/read`,
      {
        method: 'PATCH',
      }
    );
    expect(res.status).toBe(200);
    expect(markReadMock.execute).toHaveBeenCalledWith(notificationId, userId);
  });

  test('PATCH /users/:userId/notifications/read-all should return 204', async () => {
    markAllReadMock.execute.mockResolvedValueOnce(undefined);
    const res = await app.request(
      `/api/users/${userId}/notifications/read-all`,
      {
        method: 'PATCH',
      }
    );
    expect(res.status).toBe(204);
    expect(markAllReadMock.execute).toHaveBeenCalledWith(userId);
  });
});
