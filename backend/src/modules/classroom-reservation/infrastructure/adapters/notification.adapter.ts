import type { INotificationProvider } from '../../domain/providers/notification.provider';
import type { CreateNotificationUseCase } from '@/modules/notification/application/create-notification.usecase';

export class NotificationAdapter implements INotificationProvider {
  constructor(
    private readonly createNotificationUseCase: CreateNotificationUseCase
  ) {}

  async notifyReservationRequested(
    userId: string,
    organizationId: string
  ): Promise<void> {
    await this.createNotificationUseCase.execute({
      userId,
      organizationId,
      title: 'Reserva solicitada',
      message: 'Tu solicitud de reserva ha sido enviada correctamente.',
      type: 'INFO',
    });
  }

  async notifyReservationStatusChanged(
    userId: string,
    organizationId: string,
    status: string,
    statusEs: string
  ): Promise<void> {
    const isAccepted = status === 'ACCEPTED';
    await this.createNotificationUseCase.execute({
      userId,
      organizationId,
      title: `Reserva ${statusEs}`,
      message: `Tu solicitud de reserva ha sido ${statusEs}.`,
      type: isAccepted ? 'SUCCESS' : 'WARNING',
    });
  }
}
