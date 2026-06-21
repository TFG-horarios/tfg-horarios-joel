import { describe, expect, test, mock } from 'bun:test';
import { MarkNotificationReadUseCase } from './mark-notification-read.usecase';
import { Notification } from '../domain/notification.entity';

describe('MarkNotificationReadUseCase', () => {
  const repositoryMock = {
    create: mock(),
    listByUserId: mock(),
    markAsRead: mock(),
    markAllAsRead: mock(),
    deleteOldNotifications: mock(),
  };

  const useCase = new MarkNotificationReadUseCase(repositoryMock);

  test('should mark as read successfully', async () => {
    const notification = Notification.create({
      userId: 'user-1',
      title: 'Test',
      message: 'Msg',
      type: 'INFO',
    });
    notification.markAsRead();
    repositoryMock.markAsRead.mockResolvedValue(notification);

    const result = await useCase.execute('notif-1', 'user-1');

    expect(result.id).toBe(notification.id);
    expect(result.isRead).toBe(true);
    expect(repositoryMock.markAsRead).toHaveBeenCalledWith('notif-1', 'user-1');
  });
});
