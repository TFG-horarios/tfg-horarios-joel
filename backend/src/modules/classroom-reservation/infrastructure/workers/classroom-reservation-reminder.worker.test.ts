import { describe, expect, test, mock, beforeAll, beforeEach } from 'bun:test';
import { ClassroomReservationReminderWorker } from './classroom-reservation-reminder.worker';
import { setupTestDb, cleanTestDb, testDb } from '@/tests/setup-db';
import {
  seedTestDb,
  testUserId,
  testOrgId,
  testClassroomId,
  testAcademicYearId,
} from '@/tests/seed-db';
import { classroomReservations } from '@/modules/classroom-reservation/infrastructure/db/drizzle.classroom-reservation.schema';
import type { CreateNotificationUseCase } from '@/modules/notification/application/create-notification.usecase';

describe('ClassroomReservationReminderWorker Integration', () => {
  let worker: ClassroomReservationReminderWorker;
  const executeMock = mock();
  const createNotificationUseCaseMock = {
    execute: executeMock,
  } as unknown as CreateNotificationUseCase;

  beforeAll(async () => {
    await setupTestDb();
    worker = new ClassroomReservationReminderWorker(
      testDb,
      createNotificationUseCaseMock
    );
  });

  beforeEach(async () => {
    await cleanTestDb();
    await seedTestDb(testDb);
    mock.restore();
    executeMock.mockClear();
  });

  test('should notify for accepted reservation tomorrow', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    await testDb.insert(classroomReservations).values({
      id: '11111111-1111-1111-1111-111111111111',
      organizationId: testOrgId,
      requesterUserId: testUserId,
      classroomId: testClassroomId,
      academicYearId: testAcademicYearId,
      date: tomorrowStr!,
      slotIndex: 1,
      status: 'ACCEPTED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await worker['runJob']();

    expect(executeMock).toHaveBeenCalled();
  });

  test('should not notify if no reservations tomorrow', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const str = tomorrow.toISOString().split('T')[0];

    await testDb.insert(classroomReservations).values({
      id: '11111111-1111-1111-1111-111111111111',
      organizationId: testOrgId,
      requesterUserId: testUserId,
      classroomId: testClassroomId,
      academicYearId: testAcademicYearId,
      date: str!,
      slotIndex: 1,
      status: 'ACCEPTED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await worker['runJob']();

    expect(executeMock).not.toHaveBeenCalled();
  });
});
