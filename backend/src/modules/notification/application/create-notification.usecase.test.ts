import { describe, expect, test, mock } from 'bun:test';
import { CreateNotificationUseCase } from './create-notification.usecase';
import { SseService } from '@/core/services/sse.service';

describe('CreateNotificationUseCase', () => {
  const repositoryMock = {
    create: mock(),
    listByUserId: mock(),
    markAsRead: mock(),
    markAllAsRead: mock(),
    deleteOldNotifications: mock(),
  };

  const useCase = new CreateNotificationUseCase(repositoryMock);

  test('should create notification successfully and broadcast', async () => {
    const broadcastMock = mock();
    SseService.getInstance = mock().mockReturnValue({
      broadcast: broadcastMock,
    });

    repositoryMock.create.mockResolvedValue(undefined);

    const dto = {
      userId: 'user-1',
      organizationId: 'org-1',
      title: 'Hello',
      message: 'World',
      type: 'INFO' as const,
    };

    const result = await useCase.execute(dto);

    expect(result.userId).toBe('user-1');
    expect(result.title).toBe('Hello');
    expect(result.isRead).toBe(false);
    expect(repositoryMock.create).toHaveBeenCalled();
    expect(broadcastMock).toHaveBeenCalledWith(
      'user_user-1',
      'notification_received',
      result
    );
  });
});
