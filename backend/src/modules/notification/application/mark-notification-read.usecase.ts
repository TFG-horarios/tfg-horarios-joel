import type { INotificationRepository } from '../domain/notification.repository';

export class MarkNotificationReadUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    await this.notificationRepository.markAsRead(id, userId);
  }
}
