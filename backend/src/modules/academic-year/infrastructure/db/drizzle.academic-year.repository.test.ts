import { describe, expect, test, beforeAll, beforeEach } from 'bun:test';
import { DrizzleAcademicYearRepository } from './drizzle.academic-year.repository';
import { AcademicYear } from '../../domain/academic-year.entity';
import { setupTestDb, cleanTestDb, testDb } from '@/tests/setup-db';
import { seedTestDb, testOrgId } from '@/tests/seed-db';

describe('DrizzleAcademicYearRepository Integration', () => {
  let repository: DrizzleAcademicYearRepository;

  beforeAll(async () => {
    await setupTestDb();
    repository = new DrizzleAcademicYearRepository(testDb);
  });

  beforeEach(async () => {
    await cleanTestDb();
    await seedTestDb(testDb);
  });

  const createValidAcademicYear = (
    name = '2024-2025',
    periodType: 'semester' | 'trimester' | 'annual' = 'semester'
  ) =>
    AcademicYear.create({
      organizationId: testOrgId,
      name,
      period0Start: '2024-09-01',
      period0End: '2025-06-30',
      period1Start: '2024-09-01',
      period1End: '2025-01-31',
      period2Start: '2025-02-01',
      period2End: '2025-06-30',
      periodType,
      morningStart: '08:00',
      morningEnd: '14:00',
      afternoonStart: '15:00',
      afternoonEnd: '21:00',
      slotDurationMinutes: 60,
    });

  test('should create and retrieve an academic year by ID', async () => {
    const ay = createValidAcademicYear();
    await repository.save(ay);

    const foundAy = await repository.findById(ay.id);
    expect(foundAy).not.toBeNull();
    expect(foundAy?.id).toBe(ay.id);
    expect(foundAy?.name).toBe('2024-2025');
    expect(foundAy?.organizationId).toBe(testOrgId);
  });

  test('should find academic years by organization ID', async () => {
    const ay1 = createValidAcademicYear('2024-2025');
    const ay2 = createValidAcademicYear('2025-2026');
    await repository.save(ay1);
    await repository.save(ay2);

    const foundAys = await repository.findByOrganizationId(testOrgId);
    expect(foundAys.length).toBeGreaterThanOrEqual(2);
    expect(foundAys.map((o) => o.id)).toContain(ay1.id);
    expect(foundAys.map((o) => o.id)).toContain(ay2.id);
  });

  test('should return null if academic year not found by ID', async () => {
    const foundAy = await repository.findById(
      '00000000-0000-0000-0000-000000000002'
    );
    expect(foundAy).toBeNull();
  });

  test('should find active academic year by organization ID', async () => {
    const ay = AcademicYear.create({
      organizationId: testOrgId,
      name: 'Active Year',
      period0Start: '1900-01-01',
      period0End: '2999-12-31',
      period1Start: null,
      period1End: null,
      period2Start: null,
      period2End: null,
      periodType: 'annual',
      morningStart: '08:00',
      morningEnd: '14:00',
      afternoonStart: '15:00',
      afternoonEnd: '21:00',
      slotDurationMinutes: 60,
    });
    await repository.save(ay);

    const activeAy = await repository.findActiveByOrganizationId(testOrgId);
    expect(activeAy).not.toBeNull();
    expect(activeAy?.id).toBe(ay.id);
  });

  test('should update an academic year successfully', async () => {
    const ay = createValidAcademicYear();
    await repository.save(ay);

    ay.update({
      name: 'Updated Name',
      slotDurationMinutes: 45,
    });
    await repository.update(ay);

    const updatedAy = await repository.findById(ay.id);
    expect(updatedAy?.name).toBe('Updated Name');
    expect(updatedAy?.slotDurationMinutes).toBe(45);
  });

  test('should delete an academic year successfully', async () => {
    const ay = createValidAcademicYear();
    await repository.save(ay);

    await repository.delete(ay.id);

    const foundAy = await repository.findById(ay.id);
    expect(foundAy).toBeNull();
  });
});
