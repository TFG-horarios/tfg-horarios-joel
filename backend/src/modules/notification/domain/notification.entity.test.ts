import { describe, expect, test } from 'bun:test';
import { Notification } from './notification.entity';

describe('Notification Entity', () => {
  test('creates a notification successfully', () => {
    const notification = Notification.create({
      userId: 'user-1',
      organizationId: 'org-1',
      title: 'Test',
      message: 'Msg',
      type: 'INFO',
    });

    expect(notification.id).toBeDefined();
    expect(notification.userId).toBe('user-1');
    expect(notification.organizationId).toBe('org-1');
    expect(notification.title).toBe('Test');
    expect(notification.message).toBe('Msg');
    expect(notification.type).toBe('INFO');
    expect(notification.isRead).toBe(false);
    expect(notification.createdAt).toBeDefined();
  });

  test('reconstitutes a notification', () => {
    const props = {
      id: 'notif-1',
      userId: 'user-1',
      organizationId: null,
      title: 'Test',
      message: 'Msg',
      type: 'WARNING' as const,
      isRead: true,
      createdAt: new Date(),
    };
    const notification = Notification.reconstitute(props);
    expect(notification.id).toBe('notif-1');
    expect(notification.isRead).toBe(true);
    expect(notification.organizationId).toBeNull();
  });

  test('markAsRead changes isRead to true', () => {
    const notification = Notification.create({
      userId: 'user-1',
      title: 'Test',
      message: 'Msg',
      type: 'INFO',
    });

    expect(notification.isRead).toBe(false);
    notification.markAsRead();
    expect(notification.isRead).toBe(true);
  });
});
