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
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
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
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
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
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
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
      content: {
        'text/event-stream': {
          schema: z.string(),
        },
      },
    },
    403: { description: 'Forbidden' },
    401: { description: 'Unauthorized' },
    500: { description: 'Internal server error' },
  },
});
