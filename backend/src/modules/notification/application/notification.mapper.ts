import type { NotificationDTO } from '@tfg-horarios/shared';
import type { Notification } from '../domain/notification.entity';

export class NotificationMapper {
  static toDTO(entity: Notification): NotificationDTO {
    return {
      id: entity.id,
      userId: entity.userId,
      organizationId: entity.organizationId,
      title: entity.title,
      message: entity.message,
      type: entity.type,
      isRead: entity.isRead,
      createdAt: entity.createdAt.toISOString(),
    };
  }

  static toDTOList(entities: Notification[]): NotificationDTO[] {
    return entities.map((entity) => this.toDTO(entity));
  }
}
