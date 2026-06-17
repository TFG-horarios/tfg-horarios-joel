import { describe, expect, test, beforeAll, beforeEach } from 'bun:test';
import { DrizzleScheduleRepository } from './drizzle.schedule.repository';
import { Schedule } from '../../domain/schedule.entity';
import { setupTestDb, cleanTestDb, testDb } from '@/tests/setup-db';
import {
  seedTestDb,
  testOrgId,
  testDegreeId,
  testSubjectGroupId,
  testClassroomId,
  testAcademicYearId,
} from '@/tests/seed-db';

describe('DrizzleScheduleRepository Integration', () => {
  let repository: DrizzleScheduleRepository;

  beforeAll(async () => {
    await setupTestDb();
    repository = new DrizzleScheduleRepository(testDb);
  });

  beforeEach(async () => {
    await cleanTestDb();
    await seedTestDb(testDb);
  });

  const createValidSchedule = () =>
    Schedule.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      academicYearId: testAcademicYearId,
      shift: 'morning',
      courseYear: 2,
      period: 1,
      itineraryId: null,
    });

  test('should create and retrieve a schedule by ID', async () => {
    const schedule = createValidSchedule();
    await repository.create(schedule);
    const foundSchedule = await repository.findById(schedule.id, testOrgId);
    expect(foundSchedule).not.toBeNull();
    expect(foundSchedule?.id).toBe(schedule.id);
    expect(foundSchedule?.academicYearId).toBe(schedule.academicYearId);
  });

  test('should find schedule by scope', async () => {
    const schedule = createValidSchedule();
    await repository.create(schedule);
    const foundSchedule = await repository.findByScope(
      testOrgId,
      testDegreeId,
      null,
      testAcademicYearId,
      2,
      1,
      'morning'
    );
    expect(foundSchedule).not.toBeNull();
    expect(foundSchedule?.id).toBe(schedule.id);
  });

  test('should find all schedules in an organization and apply filters', async () => {
    const s1 = createValidSchedule();
    const s2 = Schedule.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      academicYearId: testAcademicYearId,
      shift: 'afternoon',
      courseYear: 1,
      period: 1,
      itineraryId: null,
    });
    s2.publish();
    await repository.create(s1);
    await repository.create(s2);
    const all = await repository.findAll(testOrgId);
    expect(all.length).toBeGreaterThanOrEqual(2);
    const morningSchedules = await repository.findPaginated(testOrgId, {
      shift: 'morning',
    });
    expect(morningSchedules.data.length).toBe(2);
    const afternoonSchedules = await repository.findPaginated(testOrgId, {
      shift: 'afternoon',
    });
    expect(afternoonSchedules.data.length).toBe(1);
    expect(afternoonSchedules.data[0]?.shift).toBe('afternoon');
    const publishedSchedules = await repository.findPaginated(testOrgId, {
      status: 'published',
    });
    expect(publishedSchedules.data.length).toBe(1);
    expect(publishedSchedules.data[0]?.status).toBe('published');
    const combinedFilters = await repository.findPaginated(testOrgId, {
      shift: 'afternoon',
      status: 'published',
      degreeId: testDegreeId,
    });
    expect(combinedFilters.data.length).toBe(1);
  });

  test('should find schedules filtered by conflicts status', async () => {
    const s1 = Schedule.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      academicYearId: testAcademicYearId,
      shift: 'morning',
      courseYear: 2,
      period: 1,
      itineraryId: null,
      conflicts: 3,
    });
    const s2 = Schedule.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      academicYearId: testAcademicYearId,
      shift: 'afternoon',
      courseYear: 2,
      period: 1,
      itineraryId: null,
      conflicts: 0,
    });
    await repository.create(s1);
    await repository.create(s2);

    const withConflicts = await repository.findPaginated(testOrgId, {
      hasConflicts: 'true',
    });
    expect(withConflicts.data.some((s) => s.id === s1.id)).toBe(true);
    expect(withConflicts.data.some((s) => s.id === s2.id)).toBe(false);

    const withoutConflicts = await repository.findPaginated(testOrgId, {
      hasConflicts: 'false',
    });
    expect(withoutConflicts.data.some((s) => s.id === s1.id)).toBe(false);
    expect(withoutConflicts.data.some((s) => s.id === s2.id)).toBe(true);
  });

  test('should update a schedule successfully', async () => {
    const schedule = createValidSchedule();
    await repository.create(schedule);
    schedule.publish();
    await repository.update(schedule);
    const updated = await repository.findById(schedule.id, testOrgId);
    expect(updated?.status).toBe('published');
  });

  test('should create schedule with slots', async () => {
    const schedule = createValidSchedule();
    const slots = [
      {
        scheduleId: schedule.id,
        subjectGroupId: testSubjectGroupId,
        classroomId: testClassroomId,
        dayOfWeek: 1,
        slotIndex: 1,
        duration: 1,
      },
    ];
    await repository.createSchedulesWithSlots([{ schedule, slots }]);
    const foundSchedule = await repository.findById(schedule.id, testOrgId);
    expect(foundSchedule).not.toBeNull();
  });
});
