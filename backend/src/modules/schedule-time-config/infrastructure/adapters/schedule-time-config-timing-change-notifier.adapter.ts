import { SseService } from '@/core/services/sse.service';
import type { CreateNotificationUseCase } from '@/modules/notification/application/create-notification.usecase';
import type { IScheduleTimeConfigTimingChangeNotifierProvider } from '../../domain/providers/schedule-time-config-timing-change-notifier.provider';

export class ScheduleTimeConfigTimingChangeNotifierAdapter implements IScheduleTimeConfigTimingChangeNotifierProvider {
  constructor(
    private readonly createNotificationUseCase?: CreateNotificationUseCase
  ) {}

  async notifyTimingChange(
    organizationId: string,
    invalidation: Parameters<
      IScheduleTimeConfigTimingChangeNotifierProvider['notifyTimingChange']
    >[1]
  ) {
    if (this.createNotificationUseCase) {
      await Promise.allSettled(
        invalidation.affectedUsers.map(({ userId, reservationCount }) =>
          this.createNotificationUseCase!.execute({
            userId,
            organizationId,
            title: 'Reservas canceladas',
            message: `${reservationCount} reserva${reservationCount === 1 ? '' : 's'} cancelada${reservationCount === 1 ? '' : 's'} por un cambio de configuración horaria.`,
            type: 'WARNING',
          })
        )
      );
    }

    const sse = SseService.getInstance();
    for (const scheduleId of invalidation.scheduleIds) {
      sse.broadcast(`schedule_${scheduleId}`, 'schedule_updated', {
        scheduleId,
        invalidated: true,
      });
    }
    for (const classroomId of invalidation.classroomIds) {
      sse.broadcast(`classroom_${classroomId}`, 'reservation_updated', {
        classroomId,
        invalidated: true,
      });
    }
  }
}
