import type { INotificationRepository } from '../domain/notification.repository';

export class MarkAllNotificationsReadUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository
  ) {}

  async execute(userId: string): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId);
  }
}
