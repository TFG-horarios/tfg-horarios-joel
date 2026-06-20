import type { INotificationRepository } from '../domain/notification.repository';
import type {
  PaginatedResponse,
  NotificationDTO,
  NotificationListQueryDTO,
} from '@tfg-horarios/shared';
import { NotificationMapper } from './notification.mapper';

export class ListNotificationsUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository
  ) {}

  async execute(
    userId: string,
    query?: NotificationListQueryDTO
  ): Promise<PaginatedResponse<NotificationDTO>> {
    const { data, meta } = await this.notificationRepository.listByUserId(
      userId,
      query
    );

    return {
      data: NotificationMapper.toDTOList(data),
      meta,
    };
  }
}
