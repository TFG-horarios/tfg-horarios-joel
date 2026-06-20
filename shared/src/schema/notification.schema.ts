import { z } from '@hono/zod-openapi';
import { PaginationQuerySchema } from './pagination.schema';

export const NotificationTypeSchema = z.enum([
  'INFO',
  'SUCCESS',
  'WARNING',
  'ERROR',
]);

export const NotificationSchema = z
  .object({
    id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    userId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
    organizationId: z
      .uuid()
      .nullable()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174002' }),
    title: z.string().min(1).openapi({ example: 'Recordatorio de reserva' }),
    message: z
      .string()
      .min(1)
      .openapi({ example: 'Tienes una reserva programada para mañana.' }),
    type: NotificationTypeSchema.openapi({ example: 'INFO' }),
    isRead: z.boolean().openapi({ example: false }),
    createdAt: z.string().openapi({ example: '2025-01-01T12:00:00Z' }),
  })
  .openapi('Notification');

export const CreateNotificationSchema = z
  .object({
    userId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
    organizationId: z
      .uuid()
      .optional()
      .nullable()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174002' }),
    title: z.string().min(1).openapi({ example: 'Recordatorio de reserva' }),
    message: z
      .string()
      .min(1)
      .openapi({ example: 'Tienes una reserva programada para mañana.' }),
    type: NotificationTypeSchema.openapi({ example: 'INFO' }),
  })
  .openapi('CreateNotification');

export const NotificationListQuerySchema = PaginationQuerySchema;

export type NotificationDTO = z.infer<typeof NotificationSchema>;
export type CreateNotificationDTO = z.infer<typeof CreateNotificationSchema>;
export type NotificationTypeDTO = z.infer<typeof NotificationTypeSchema>;
export type NotificationListQueryDTO = z.infer<
  typeof NotificationListQuerySchema
>;
