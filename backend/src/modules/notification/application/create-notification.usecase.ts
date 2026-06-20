import type { INotificationRepository } from '../domain/notification.repository';
import { Notification } from '../domain/notification.entity';
import { SseService } from '@/core/services/sse.service';
import type {
  NotificationDTO,
  CreateNotificationDTO,
} from '@tfg-horarios/shared';
import { NotificationMapper } from './notification.mapper';

export class CreateNotificationUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository
  ) {}

  async execute(dto: CreateNotificationDTO): Promise<NotificationDTO> {
    const notification = Notification.create({
      userId: dto.userId,
      organizationId: dto.organizationId ?? null,
      title: dto.title,
      message: dto.message,
      type: dto.type,
    });

    await this.notificationRepository.create(notification);
    const resultDto = NotificationMapper.toDTO(notification);

    SseService.getInstance().broadcast(
      `user_${notification.userId}`,
      'notification_received',
      resultDto
    );

    return resultDto;
  }
}
