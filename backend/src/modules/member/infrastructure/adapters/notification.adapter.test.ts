import { describe, expect, test, mock } from 'bun:test';
import { NotificationAdapter } from './notification.adapter';
import type { CreateNotificationUseCase } from '@/modules/notification/application/create-notification.usecase';

describe('NotificationAdapter', () => {
  const executeMock = mock();
  const createNotificationUseCaseMock = {
    execute: executeMock,
  } as unknown as CreateNotificationUseCase;

  const adapter = new NotificationAdapter(createNotificationUseCaseMock);

  test('notifyAddedToOrganization should call createNotificationUseCase', async () => {
    executeMock.mockResolvedValue(undefined);
    await adapter.notifyAddedToOrganization('user-1', 'org-1');
    expect(executeMock).toHaveBeenCalled();
  });

  test('notifyRoleUpdated should call createNotificationUseCase', async () => {
    executeMock.mockResolvedValue(undefined);
    await adapter.notifyRoleUpdated('user-1', 'org-1', 'admin');
    expect(executeMock).toHaveBeenCalled();
  });

  test('notifyRemovedFromOrganization should call createNotificationUseCase', async () => {
    executeMock.mockResolvedValue(undefined);
    await adapter.notifyRemovedFromOrganization('user-1', 'org-1');
    expect(executeMock).toHaveBeenCalled();
  });
});
