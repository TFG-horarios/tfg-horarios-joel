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
      academicYear: '2025/2026',
      shift: 'morning',
      courseYear: 1,
      period: 1,
      itineraryId: null,
    });

  test('should create and retrieve a schedule by ID', async () => {
    const schedule = createValidSchedule();
    await repository.create(schedule);
    const foundSchedule = await repository.findById(schedule.id, testOrgId);
    expect(foundSchedule).not.toBeNull();
    expect(foundSchedule?.id).toBe(schedule.id);
    expect(foundSchedule?.academicYear).toBe('2025/2026');
  });

  test('should find published schedule by scope', async () => {
    const schedule = createValidSchedule();
    schedule.publish();
    await repository.create(schedule);
    const foundSchedule = await repository.findPublishedByScope(
      testOrgId,
      testDegreeId,
      null,
      '2025/2026',
      1,
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
      academicYear: '2025/2026',
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
    const morningSchedules = await repository.findAll(testOrgId, {
      shift: 'morning',
    });
    expect(morningSchedules.length).toBe(2);
    const afternoonSchedules = await repository.findAll(testOrgId, {
      shift: 'afternoon',
    });
    expect(afternoonSchedules.length).toBe(1);
    expect(afternoonSchedules[0]?.shift).toBe('afternoon');
    const publishedSchedules = await repository.findAll(testOrgId, {
      status: 'published',
    });
    expect(publishedSchedules.length).toBe(1);
    expect(publishedSchedules[0]?.status).toBe('published');
    const combinedFilters = await repository.findAll(testOrgId, {
      shift: 'afternoon',
      status: 'published',
      degreeId: testDegreeId,
    });
    expect(combinedFilters.length).toBe(1);
  });

  test('should update a schedule successfully', async () => {
    const schedule = createValidSchedule();
    await repository.create(schedule);
    schedule.publish();
    await repository.update(schedule);
    const updated = await repository.findById(schedule.id, testOrgId);
    expect(updated?.status).toBe('published');
  });

  test('should publish and archive', async () => {
    const oldSchedule = createValidSchedule();
    oldSchedule.publish();
    await repository.create(oldSchedule);
    const newSchedule = Schedule.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      academicYear: '2025/2026',
      shift: 'morning',
      courseYear: 1,
      period: 1,
      itineraryId: null,
      version: 'v2',
    });
    await repository.create(newSchedule);
    oldSchedule.archive();
    newSchedule.publish();
    await repository.publishAndArchive(newSchedule, oldSchedule);
    const oldAfter = await repository.findById(oldSchedule.id, testOrgId);
    const newAfter = await repository.findById(newSchedule.id, testOrgId);
    expect(oldAfter?.status).toBe('archived');
    expect(newAfter?.status).toBe('published');
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
