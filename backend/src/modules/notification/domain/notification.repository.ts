import type { Notification } from './notification.entity';
import type {
  PaginatedResponse,
  NotificationListQueryDTO,
} from '@tfg-horarios/shared';

export interface INotificationRepository {
  create(notification: Notification): Promise<void>;
  listByUserId(
    userId: string,
    filters?: NotificationListQueryDTO
  ): Promise<PaginatedResponse<Notification>>;
  markAsRead(id: string, userId: string): Promise<Notification>;
  markAllAsRead(userId: string): Promise<void>;
  deleteOldNotifications(days: number): Promise<void>;
}
