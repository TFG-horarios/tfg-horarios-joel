import { describe, expect, test, beforeAll, beforeEach } from 'bun:test';
import { DrizzleClassroomReservationRepository } from './drizzle.classroom-reservation.repository';
import { ClassroomReservation } from '../../domain/classroom-reservation.entity';
import { setupTestDb, cleanTestDb, testDb } from '@/tests/setup-db';
import {
  seedTestDb,
  testOrgId,
  testUserId,
  testClassroomId,
  testAcademicYearId,
} from '@/tests/seed-db';
import { type ClassroomReservationStatusDTO } from '@tfg-horarios/shared';

describe('DrizzleClassroomReservationRepository Integration', () => {
  let repository: DrizzleClassroomReservationRepository;

  beforeAll(async () => {
    await setupTestDb();
    repository = new DrizzleClassroomReservationRepository(testDb);
  });

  beforeEach(async () => {
    await cleanTestDb();
    await seedTestDb(testDb);
  });

  const createValidReservation = (
    date = '2025-01-01',
    status: ClassroomReservationStatusDTO = 'PENDING'
  ) =>
    ClassroomReservation.create({
      organizationId: testOrgId,
      requesterUserId: testUserId,
      classroomId: testClassroomId,
      academicYearId: testAcademicYearId,
      date,
      slotIndex: 1,
      status,
    });

  test('should save and findById successfully', async () => {
    const res = createValidReservation();
    await repository.save(res);

    const found = await repository.findById(res.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(res.id);
    expect(found?.status).toBe('PENDING');
  });

  test('should return null if findById not found', async () => {
    const found = await repository.findById(
      '00000000-0000-0000-0000-000000000002'
    );
    expect(found).toBeNull();
  });

  test('should update reservation successfully', async () => {
    const res = createValidReservation();
    await repository.save(res);

    res.accept();
    await repository.update(res);

    const found = await repository.findById(res.id);
    expect(found?.status).toBe('ACCEPTED');
  });

  test('findPaginated should return paginated reservations', async () => {
    await repository.save(createValidReservation('2025-01-01'));
    await repository.save(createValidReservation('2025-01-02'));

    const result = await repository.findPaginated(testOrgId, {
      page: 1,
      limit: 10,
    });
    expect(result.data.length).toBe(2);
    expect(result.meta.total).toBe(2);
  });

  test('findPaginated should filter by requesterUserId and status', async () => {
    await repository.save(createValidReservation('2025-01-01', 'PENDING'));
    await repository.save(createValidReservation('2025-01-02', 'ACCEPTED'));

    const result = await repository.findPaginated(
      testOrgId,
      { page: 1, limit: 10, status: 'ACCEPTED' },
      testUserId
    );
    expect(result.data.length).toBe(1);
    expect(result.data[0]?.status).toBe('ACCEPTED');
  });

  test('hasAcceptedFutureReservation should return true if accepted in future for dayOfWeek', async () => {
    const today = new Date();
    today.setDate(today.getDate() + 7);
    const dateStr = today.toISOString().split('T')[0];

    const res = createValidReservation(dateStr, 'ACCEPTED');
    await repository.save(res);

    const jsDayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
    const result = await repository.hasAcceptedFutureReservation(
      testOrgId,
      testClassroomId,
      jsDayOfWeek,
      1
    );
    expect(result).toBe(true);
  });

  test('hasAcceptedReservationOnDate should return true if accepted on exact date', async () => {
    const res = createValidReservation('2025-05-05', 'ACCEPTED');
    await repository.save(res);

    const result = await repository.hasAcceptedReservationOnDate(
      testOrgId,
      testClassroomId,
      '2025-05-05',
      1
    );
    expect(result).toBe(true);
  });

  test('findReservationsInDateRange should return reservations within range', async () => {
    await repository.save(createValidReservation('2025-01-05'));
    await repository.save(createValidReservation('2025-01-10'));
    await repository.save(createValidReservation('2025-01-15'));

    const result = await repository.findReservationsInDateRange(
      testOrgId,
      testClassroomId,
      '2025-01-01',
      '2025-01-12'
    );
    expect(result.length).toBe(2);
  });
});
