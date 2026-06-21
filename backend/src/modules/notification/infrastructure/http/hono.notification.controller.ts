import type { RouteHandler } from '@hono/zod-openapi';
import type { AppEnv } from '@/core/types/app-types';
import type {
  listNotificationsRoute,
  markNotificationReadRoute,
  markAllNotificationsReadRoute,
  streamUserNotificationsRoute,
} from './hono.notification.routes';
import type { ListNotificationsUseCase } from '../../application/list-notifications.usecase';
import type { MarkNotificationReadUseCase } from '../../application/mark-notification-read.usecase';
import type { MarkAllNotificationsReadUseCase } from '../../application/mark-all-notifications-read.usecase';
import { streamSSE } from 'hono/streaming';
import { SseService } from '@/core/services/sse.service';

export class HonoNotificationController {
  constructor(
    private readonly listNotificationsUseCase: ListNotificationsUseCase,
    private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
    private readonly markAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase
  ) {}

  list: RouteHandler<typeof listNotificationsRoute, AppEnv> = async (c) => {
    const { userId } = c.req.valid('param');
    const query = c.req.valid('query');
    const notifications = await this.listNotificationsUseCase.execute(
      userId,
      query
    );
    return c.json(notifications, 200);
  };

  markAsRead: RouteHandler<typeof markNotificationReadRoute, AppEnv> = async (
    c
  ) => {
    const { userId, id } = c.req.valid('param');
    const notification = await this.markNotificationReadUseCase.execute(
      id,
      userId
    );
    return c.json(notification, 200);
  };

  markAllAsRead: RouteHandler<typeof markAllNotificationsReadRoute, AppEnv> =
    async (c) => {
      const { userId } = c.req.valid('param');
      await this.markAllNotificationsReadUseCase.execute(userId);
      return c.body(null, 204);
    };

  streamEvents: RouteHandler<typeof streamUserNotificationsRoute, AppEnv> =
    async (c) => {
      const { userId } = c.req.valid('param');
      const topic = `user_${userId}`;
      return streamSSE(c, async (stream) => {
        const sseService = SseService.getInstance();
        sseService.addClient(topic, stream);

        stream.onAbort(() => {
          sseService.removeClient(topic, stream);
        });

        while (true) {
          await stream.sleep(30000);
          try {
            await stream.writeSSE({ event: 'ping', data: 'keep-alive' });
          } catch {
            break;
          }
        }
      });
    };
}
