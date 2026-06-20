import { createRoute, z } from '@hono/zod-openapi';
import {
  NotificationSchema,
  NotificationListQuerySchema,
  createPaginatedSchema,
} from '@tfg-horarios/shared';

const tags = ['Notifications'];

const UserIdParamSchema = z.object({
  userId: z.string().uuid(),
});

const NotificationIdParamSchema = z.object({
  userId: z.string().uuid(),
  id: z.string().uuid(),
});

export const listNotificationsRoute = createRoute({
  method: 'get',
  path: '/users/{userId}/notifications',
  tags,
  request: {
    params: UserIdParamSchema,
    query: NotificationListQuerySchema,
  },
  responses: {
    200: {
      description: 'List of notifications',
      content: {
        'application/json': {
          schema: createPaginatedSchema(NotificationSchema),
        },
      },
    },
    403: { description: 'Forbidden' },
  },
});

export const markNotificationReadRoute = createRoute({
  method: 'patch',
  path: '/users/{userId}/notifications/{id}/read',
  tags,
  request: {
    params: NotificationIdParamSchema,
  },
  responses: {
    200: {
      description: 'Notification marked as read',
      content: {
        'application/json': {
          schema: NotificationSchema,
        },
      },
    },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
  },
});

export const markAllNotificationsReadRoute = createRoute({
  method: 'patch',
  path: '/users/{userId}/notifications/read-all',
  tags,
  request: {
    params: UserIdParamSchema,
  },
  responses: {
    204: {
      description: 'All notifications marked as read',
    },
    403: { description: 'Forbidden' },
  },
});

export const streamUserNotificationsRoute = createRoute({
  method: 'get',
  path: '/users/{userId}/notifications/stream',
  tags,
  request: {
    params: UserIdParamSchema,
  },
  responses: {
    200: {
      description: 'SSE notifications stream',
    },
    403: { description: 'Forbidden' },
  },
});
