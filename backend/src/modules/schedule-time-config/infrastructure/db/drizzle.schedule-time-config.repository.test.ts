import { describe, expect, test, beforeAll, beforeEach } from 'bun:test';
import { DrizzleScheduleTimeConfigRepository } from './drizzle.schedule-time-config.repository';
import { ScheduleTimeConfig } from '../../domain/schedule-time-config.entity';
import { setupTestDb, cleanTestDb, testDb } from '@/tests/setup-db';
import { eq } from 'drizzle-orm';
import { schedulesTable } from '@/modules/schedule/infrastructure/db/drizzle.schedule.schema';
import {
  seedTestDb,
  testOrgId,
  testDegreeId,
  testItineraryId,
  testAcademicYearId,
  testScheduleId,
} from '@/tests/seed-db';

describe('DrizzleScheduleTimeConfigRepository Integration', () => {
  let repository: DrizzleScheduleTimeConfigRepository;

  beforeAll(async () => {
    await setupTestDb();
    repository = new DrizzleScheduleTimeConfigRepository(testDb);
  });

  beforeEach(async () => {
    await cleanTestDb();
    await seedTestDb(testDb);
  });

  const createValidConfig = (id?: string) =>
    ScheduleTimeConfig.create({
      id,
      organizationId: testOrgId,
      academicYearId: testAcademicYearId,
      degreeId: testDegreeId,
      itineraryId: null,
      courseYear: 1,
      period: 1,
      shift: 'morning',
      startTime: '08:00',
      endTime: '14:00',
      hasBreak: true,
      breakAfterSlot: 3,
    });

  test('should create and retrieve a schedule time config by ID', async () => {
    const config = createValidConfig();
    await repository.save(config);
    const foundConfig = await repository.findById(config.id);
    expect(foundConfig).not.toBeNull();
    expect(foundConfig?.id).toBe(config.id);
    expect(foundConfig?.startTime).toBe('08:00');
    expect(foundConfig?.hasBreak).toBeTrue();
  });

  test('should return null if schedule time config not found by ID', async () => {
    const foundConfig = await repository.findById(
      'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'
    );
    expect(foundConfig).toBeNull();
  });

  test('should find all schedule time configs for a scope', async () => {
    const config1 = createValidConfig();
    const config2 = ScheduleTimeConfig.create({
      organizationId: testOrgId,
      academicYearId: testAcademicYearId,
      degreeId: testDegreeId,
      itineraryId: testItineraryId,
      courseYear: 1,
      period: 1,
      shift: 'morning',
      startTime: '09:00',
      endTime: '15:00',
      hasBreak: false,
      breakAfterSlot: null,
    });

    await repository.save(config1);
    await repository.save(config2);

    const configs = await repository.findAll(testOrgId, testAcademicYearId, {
      degreeId: testDegreeId,
    });

    expect(configs.length).toBe(2);
    const ids = configs.map((c) => c.id);
    expect(ids).toContain(config1.id);
    expect(ids).toContain(config2.id);
  });

  test('should find possibilities based on subjects', async () => {
    const possibilities = await repository.findPossibilities(testOrgId);
    expect(possibilities.length).toBeGreaterThan(0);
    const possibility = possibilities.find(
      (p) =>
        p.degreeId === testDegreeId &&
        p.courseYear === 1 &&
        p.period === 1 &&
        p.shift === 'morning'
    );
    expect(possibility).toBeDefined();
    expect(possibility?.itineraryId).toBeNull();
  });

  test('should find effective config', async () => {
    const baseConfig = createValidConfig();
    await repository.save(baseConfig);

    const effectiveBase = await repository.findEffective({
      organizationId: testOrgId,
      academicYearId: testAcademicYearId,
      degreeId: testDegreeId,
      itineraryId: null,
      courseYear: 1,
      period: 1,
      shift: 'morning',
    });
    expect(effectiveBase?.id).toBe(baseConfig.id);

    const specificConfig = ScheduleTimeConfig.create({
      organizationId: testOrgId,
      academicYearId: testAcademicYearId,
      degreeId: testDegreeId,
      itineraryId: testItineraryId,
      courseYear: 1,
      period: 1,
      shift: 'morning',
      startTime: '10:00',
      endTime: '12:00',
      hasBreak: false,
      breakAfterSlot: null,
    });
    await repository.save(specificConfig);

    const effectiveSpecific = await repository.findEffective({
      organizationId: testOrgId,
      academicYearId: testAcademicYearId,
      degreeId: testDegreeId,
      itineraryId: testItineraryId,
      courseYear: 1,
      period: 1,
      shift: 'morning',
    });
    expect(effectiveSpecific?.id).toBe(specificConfig.id);
    expect(effectiveSpecific?.startTime).toBe('10:00');

    const effectiveFallback = await repository.findEffective({
      organizationId: testOrgId,
      academicYearId: testAcademicYearId,
      degreeId: testDegreeId,
      itineraryId: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      courseYear: 1,
      period: 1,
      shift: 'morning',
    });
    expect(effectiveFallback?.id).toBe(baseConfig.id);
  });

  test('should validate scope successfully if academic year and degree match', async () => {
    const isValid = await repository.validateScope({
      organizationId: testOrgId,
      academicYearId: testAcademicYearId,
      degreeId: testDegreeId,
      itineraryId: null,
      courseYear: 1,
      period: 1,
      shift: 'morning',
    });
    expect(isValid).toBeTrue();
  });

  test('should return false when validating non-existent scope', async () => {
    const isValid = await repository.validateScope({
      organizationId: testOrgId,
      academicYearId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99',
      degreeId: testDegreeId,
      itineraryId: null,
      courseYear: 1,
      period: 1,
      shift: 'morning',
    });
    expect(isValid).toBeFalse();
  });

  test('should check if config is referenced in schedule', async () => {
    const config = createValidConfig();
    await repository.save(config);

    let referenced = await repository.isReferenced(config.id);
    expect(referenced).toBeFalse();

    await testDb
      .update(schedulesTable)
      .set({ timeConfigId: config.id })
      .where(eq(schedulesTable.id, testScheduleId));

    referenced = await repository.isReferenced(config.id);
    expect(referenced).toBeTrue();
  });

  test('should update a schedule time config successfully', async () => {
    const config = createValidConfig();
    await repository.save(config);

    config.updateTiming({
      startTime: '09:00',
      endTime: '15:00',
      hasBreak: false,
      breakAfterSlot: null,
    });
    await repository.update(config);

    const updatedConfig = await repository.findById(config.id);
    expect(updatedConfig?.startTime).toBe('09:00');
    expect(updatedConfig?.endTime).toBe('15:00');
    expect(updatedConfig?.hasBreak).toBeFalse();
  });

  test('should delete a schedule time config successfully', async () => {
    const config = createValidConfig();
    await repository.save(config);

    const foundConfig = await repository.findById(config.id);
    expect(foundConfig).not.toBeNull();

    await repository.delete(config.id);

    const deletedConfig = await repository.findById(config.id);
    expect(deletedConfig).toBeNull();
  });
});
