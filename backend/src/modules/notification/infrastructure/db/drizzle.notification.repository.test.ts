import { describe, expect, test, beforeAll, beforeEach } from 'bun:test';
import { DrizzleNotificationRepository } from './drizzle.notification.repository';
import { Notification } from '../../domain/notification.entity';
import { setupTestDb, cleanTestDb, testDb } from '@/tests/setup-db';
import { seedTestDb, testUserId } from '@/tests/seed-db';

describe('DrizzleNotificationRepository Integration', () => {
  let repository: DrizzleNotificationRepository;

  beforeAll(async () => {
    await setupTestDb();
    repository = new DrizzleNotificationRepository(testDb);
  });

  beforeEach(async () => {
    await cleanTestDb();
    await seedTestDb(testDb);
  });

  const createNotification = (title = 'Test') =>
    Notification.create({
      userId: testUserId,
      title,
      message: 'Hello',
      type: 'INFO',
    });

  test('should create a notification', async () => {
    const notification = createNotification();
    await repository.create(notification);

    const result = await repository.listByUserId(testUserId);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.title).toBe('Test');
  });

  test('listByUserId should paginate correctly', async () => {
    await repository.create(createNotification('1'));
    await repository.create(createNotification('2'));
    await repository.create(createNotification('3'));

    const result = await repository.listByUserId(testUserId, {
      page: 1,
      limit: 2,
    });
    expect(result.data).toHaveLength(2);
    expect(result.meta.total).toBe(3);
    expect(result.meta.totalPages).toBe(2);
  });

  test('markAsRead should set isRead to true', async () => {
    const notification = createNotification();
    await repository.create(notification);

    const listResult = await repository.listByUserId(testUserId);
    const savedId = listResult.data[0]?.id || '';

    const marked = await repository.markAsRead(savedId, testUserId);
    expect(marked.isRead).toBe(true);
    expect(marked.id).toBe(savedId);
  });

  test('markAsRead should throw if not found', async () => {
    expect(
      repository.markAsRead('00000000-0000-0000-0000-000000000000', testUserId)
    ).rejects.toThrow();
  });

  test('markAllAsRead should set all to read', async () => {
    await repository.create(createNotification('1'));
    await repository.create(createNotification('2'));

    await repository.markAllAsRead(testUserId);

    const result = await repository.listByUserId(testUserId);
    expect(result.data[0]?.isRead).toBe(true);
    expect(result.data[1]?.isRead).toBe(true);
  });

  test('deleteOldNotifications should delete notifications older than days', async () => {
    await repository.create(createNotification('1'));
    await repository.deleteOldNotifications(30);

    const result = await repository.listByUserId(testUserId);
    expect(result.data).toHaveLength(1);
  });
});
