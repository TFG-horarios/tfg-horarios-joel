import { describe, expect, test, mock } from 'bun:test';
import { ListNotificationsUseCase } from './list-notifications.usecase';
import { Notification } from '../domain/notification.entity';

describe('ListNotificationsUseCase', () => {
  const repositoryMock = {
    create: mock(),
    listByUserId: mock(),
    markAsRead: mock(),
    markAllAsRead: mock(),
    deleteOldNotifications: mock(),
  };

  const useCase = new ListNotificationsUseCase(repositoryMock);

  test('should list notifications successfully', async () => {
    const notification = Notification.create({
      userId: 'user-1',
      title: 'Test',
      message: 'Msg',
      type: 'INFO',
    });
    repositoryMock.listByUserId.mockResolvedValue({
      data: [notification],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    const result = await useCase.execute('user-1', { page: 1, limit: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.id).toBe(notification.id);
    expect(result.meta.total).toBe(1);
    expect(repositoryMock.listByUserId).toHaveBeenCalledWith('user-1', {
      page: 1,
      limit: 10,
    });
  });
});
