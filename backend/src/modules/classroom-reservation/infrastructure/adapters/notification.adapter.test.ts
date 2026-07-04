import { describe, expect, test, mock } from 'bun:test';
import { NotificationAdapter } from './notification.adapter';
import type { CreateNotificationUseCase } from '@/modules/notification/application/create-notification.usecase';

describe('NotificationAdapter', () => {
  const executeMock = mock();
  const createNotificationUseCaseMock = {
    execute: executeMock,
  } as unknown as CreateNotificationUseCase;

  const adapter = new NotificationAdapter(createNotificationUseCaseMock);

  test('notifyReservationRequested should create notification', async () => {
    await adapter.notifyReservationRequested('user-1', 'org-1');
    expect(createNotificationUseCaseMock.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      organizationId: 'org-1',
      title: 'Reserva solicitada',
      message: 'Tu solicitud de reserva ha sido enviada correctamente.',
      type: 'INFO',
    });
  });

  test('notifyReservationStatusChanged should create SUCCESS notification for ACCEPTED', async () => {
    await adapter.notifyReservationStatusChanged(
      'user-1',
      'org-1',
      'ACCEPTED',
      'Aceptada'
    );
    expect(createNotificationUseCaseMock.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      organizationId: 'org-1',
      title: 'Reserva Aceptada',
      message: 'Tu solicitud de reserva ha sido Aceptada.',
      type: 'SUCCESS',
    });
  });

  test('notifyReservationStatusChanged should create WARNING notification for other status', async () => {
    await adapter.notifyReservationStatusChanged(
      'user-1',
      'org-1',
      'REJECTED',
      'Rechazada'
    );
    expect(createNotificationUseCaseMock.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      organizationId: 'org-1',
      title: 'Reserva Rechazada',
      message: 'Tu solicitud de reserva ha sido Rechazada.',
      type: 'WARNING',
    });
  });
});
