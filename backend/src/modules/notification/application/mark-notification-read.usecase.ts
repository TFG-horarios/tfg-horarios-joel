import type { INotificationRepository } from '../domain/notification.repository';
import type { NotificationDTO } from '@tfg-horarios/shared';
import { NotificationMapper } from './notification.mapper';

export class MarkNotificationReadUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository
  ) {}

  async execute(id: string, userId: string): Promise<NotificationDTO> {
    const notification = await this.notificationRepository.markAsRead(
      id,
      userId
    );
    return NotificationMapper.toDTO(notification);
  }
}
