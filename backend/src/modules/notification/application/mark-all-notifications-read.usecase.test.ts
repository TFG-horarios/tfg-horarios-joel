import { describe, expect, test, mock } from 'bun:test';
import { MarkAllNotificationsReadUseCase } from './mark-all-notifications-read.usecase';

describe('MarkAllNotificationsReadUseCase', () => {
  const repositoryMock = {
    create: mock(),
    listByUserId: mock(),
    markAsRead: mock(),
    markAllAsRead: mock(),
    deleteOldNotifications: mock(),
  };

  const useCase = new MarkAllNotificationsReadUseCase(repositoryMock);

  test('should mark all as read successfully', async () => {
    repositoryMock.markAllAsRead.mockResolvedValue(undefined);
    await useCase.execute('user-1');
    expect(repositoryMock.markAllAsRead).toHaveBeenCalledWith('user-1');
  });
});
