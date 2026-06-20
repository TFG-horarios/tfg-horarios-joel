import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbConnection } from '@/core/db/connection';
import type { AppEnv } from '@/core/types/app-types';
import { DrizzleNotificationRepository } from './infrastructure/db/drizzle.notification.repository';
import { ListNotificationsUseCase } from './application/list-notifications.usecase';
import { MarkNotificationReadUseCase } from './application/mark-notification-read.usecase';
import { MarkAllNotificationsReadUseCase } from './application/mark-all-notifications-read.usecase';
import { CreateNotificationUseCase } from './application/create-notification.usecase';
import { HonoNotificationController } from './infrastructure/http/hono.notification.controller';
import {
  listNotificationsRoute,
  markNotificationReadRoute,
  markAllNotificationsReadRoute,
  streamUserNotificationsRoute,
} from './infrastructure/http/hono.notification.routes';

export const createNotificationModule = (db: DbConnection) => {
  const repository = new DrizzleNotificationRepository(db);

  const listUseCase = new ListNotificationsUseCase(repository);
  const markReadUseCase = new MarkNotificationReadUseCase(repository);
  const markAllReadUseCase = new MarkAllNotificationsReadUseCase(repository);
  const createUseCase = new CreateNotificationUseCase(repository);

  const controller = new HonoNotificationController(
    listUseCase,
    markReadUseCase,
    markAllReadUseCase
  );

  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(listNotificationsRoute, controller.list)
    .openapi(markNotificationReadRoute, controller.markAsRead)
    .openapi(markAllNotificationsReadRoute, controller.markAllAsRead)
    .openapi(streamUserNotificationsRoute, controller.streamEvents);

  return { routes, createUseCase };
};
