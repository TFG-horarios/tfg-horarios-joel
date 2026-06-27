import type { IAcademicYearNotificationProvider } from '../../domain/providers/academic-year-notification.provider';
import type { CreateNotificationUseCase } from '@/modules/notification/application/create-notification.usecase';

export class AcademicYearNotificationAdapter implements IAcademicYearNotificationProvider {
  constructor(
    private readonly createNotificationUseCase: CreateNotificationUseCase
  ) {}

  async notifyReservationsCancelled(
    userId: string,
    organizationId: string,
    reservationCount: number
  ): Promise<void> {
    await this.createNotificationUseCase.execute({
      userId,
      organizationId,
      title: 'Reservas canceladas',
      message: `${reservationCount} reserva${reservationCount === 1 ? '' : 's'} cancelada${reservationCount === 1 ? '' : 's'} por un cambio en la estructura horaria del año académico.`,
      type: 'WARNING',
    });
  }
}
