import { describe, expect, test } from 'bun:test';
import { NotificationMapper } from './notification.mapper';
import { Notification } from '../domain/notification.entity';

describe('NotificationMapper', () => {
  test('toDTO should map correctly', () => {
    const notification = Notification.create({
      userId: 'user-1',
      organizationId: 'org-1',
      title: 'Test',
      message: 'Message',
      type: 'INFO',
    });

    const dto = NotificationMapper.toDTO(notification);

    expect(dto.id).toBe(notification.id);
    expect(dto.userId).toBe('user-1');
    expect(dto.organizationId).toBe('org-1');
    expect(dto.title).toBe('Test');
    expect(dto.message).toBe('Message');
    expect(dto.type).toBe('INFO');
    expect(dto.isRead).toBe(false);
    expect(dto.createdAt).toBe(notification.createdAt.toISOString());
  });

  test('toDTOList should map array correctly', () => {
    const notification1 = Notification.create({
      userId: 'user-1',
      title: 'Test 1',
      message: 'Msg 1',
      type: 'INFO',
    });
    const notification2 = Notification.create({
      userId: 'user-1',
      title: 'Test 2',
      message: 'Msg 2',
      type: 'WARNING',
    });

    const dtoList = NotificationMapper.toDTOList([
      notification1,
      notification2,
    ]);

    expect(dtoList).toHaveLength(2);
    expect(dtoList[0]?.id).toBe(notification1.id);
    expect(dtoList[1]?.id).toBe(notification2.id);
  });
});
