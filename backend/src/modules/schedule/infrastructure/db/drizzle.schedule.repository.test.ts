import { describe, expect, test, beforeAll, beforeEach } from 'bun:test';
import { DrizzleScheduleRepository } from './drizzle.schedule.repository';
import { Schedule } from '../../domain/schedule.entity';
import { setupTestDb, cleanTestDb, testDb } from '@/tests/setup-db';
import {
  seedTestDb,
  testOrgId,
  testDegreeId,
  testItineraryId,
  testSubjectId,
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

  test('should find schedules filtered by conflicts and unassigned status', async () => {
    const conflictOnly = Schedule.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      academicYearId: testAcademicYearId,
      shift: 'afternoon',
      courseYear: 1,
      period: 1,
      itineraryId: null,
      conflicts: 3,
    });
    const unassignedOnly = Schedule.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      academicYearId: testAcademicYearId,
      shift: 'afternoon',
      courseYear: 2,
      period: 1,
      itineraryId: null,
      unassigned: 2,
    });
    const conflictsAndUnassigned = Schedule.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      academicYearId: testAcademicYearId,
      shift: 'morning',
      courseYear: 3,
      period: 2,
      itineraryId: null,
      conflicts: 2,
      unassigned: 1,
    });
    const cleanSchedule = Schedule.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      academicYearId: testAcademicYearId,
      shift: 'afternoon',
      courseYear: 4,
      period: 2,
      itineraryId: null,
      conflicts: 0,
    });
    await repository.create(conflictOnly);
    await repository.create(unassignedOnly);
    await repository.create(conflictsAndUnassigned);
    await repository.create(cleanSchedule);

    const allSchedules = await repository.findPaginated(testOrgId, {
      hasConflicts: 'all',
    });
    expect(allSchedules.data.length).toBeGreaterThanOrEqual(4);

    const conflictSchedules = await repository.findPaginated(testOrgId, {
      hasConflicts: 'conflicts',
    });
    expect(conflictSchedules.data.some((s) => s.id === conflictOnly.id)).toBe(
      true
    );
    expect(conflictSchedules.data.some((s) => s.id === unassignedOnly.id)).toBe(
      false
    );
    expect(
      conflictSchedules.data.some((s) => s.id === conflictsAndUnassigned.id)
    ).toBe(false);

    const unassignedSchedules = await repository.findPaginated(testOrgId, {
      hasConflicts: 'unassigned',
    });
    expect(
      unassignedSchedules.data.some((s) => s.id === unassignedOnly.id)
    ).toBe(true);
    expect(unassignedSchedules.data.some((s) => s.id === conflictOnly.id)).toBe(
      false
    );
    expect(
      unassignedSchedules.data.some((s) => s.id === conflictsAndUnassigned.id)
    ).toBe(false);

    const combinedSchedules = await repository.findPaginated(testOrgId, {
      hasConflicts: 'conflictsAndUnassigned',
    });
    expect(
      combinedSchedules.data.some((s) => s.id === conflictsAndUnassigned.id)
    ).toBe(true);
    expect(combinedSchedules.data.some((s) => s.id === conflictOnly.id)).toBe(
      false
    );
    expect(combinedSchedules.data.some((s) => s.id === unassignedOnly.id)).toBe(
      false
    );
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
        conflicts: [],
      },
    ];
    await repository.createSchedulesWithSlots([{ schedule, slots }]);
    const foundSchedule = await repository.findById(schedule.id, testOrgId);
    expect(foundSchedule).not.toBeNull();
  });

  test('should keep unassigned diagnostics out of the conflict count', async () => {
    const schedule = createValidSchedule();
    await repository.createSchedulesWithSlots([
      {
        schedule,
        slots: [
          {
            scheduleId: schedule.id,
            subjectGroupId: testSubjectGroupId,
            classroomId: null,
            dayOfWeek: null,
            slotIndex: null,
            duration: 1,
            conflicts: [
              {
                type: 'UNASSIGNED_ROOM_CAPACITY',
                message: 'ERR_UNASSIGNED_ROOM_CAPACITY',
              },
              { type: 'ROOM_CAPACITY', message: 'ERR_ROOM_CAPACITY' },
            ],
          },
        ],
      },
    ]);

    const persisted = await repository.findById(schedule.id, testOrgId);
    expect(persisted?.unassigned).toBe(1);
    expect(persisted?.conflicts).toBe(1);
  });

  test('should hide canonical common schedules from user-facing lists', async () => {
    const commonSchedule = Schedule.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      academicYearId: testAcademicYearId,
      shift: 'morning',
      courseYear: 3,
      period: 2,
      itineraryId: null,
      isCanonicalCommon: true,
    });
    const itinerarySchedule = Schedule.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      academicYearId: testAcademicYearId,
      shift: 'morning',
      courseYear: 3,
      period: 2,
      itineraryId: testItineraryId,
    });
    const commonSlotId = crypto.randomUUID();

    await repository.createSchedulesWithSlots([
      {
        schedule: commonSchedule,
        slots: [
          {
            id: commonSlotId,
            scheduleId: commonSchedule.id,
            subjectGroupId: testSubjectGroupId,
            classroomId: testClassroomId,
            dayOfWeek: 1,
            slotIndex: 1,
            duration: 1,
            conflicts: [],
          },
        ],
      },
      {
        schedule: itinerarySchedule,
        slots: [],
        inclusions: [
          {
            scheduleId: itinerarySchedule.id,
            slotId: commonSlotId,
            conflicts: [],
          },
        ],
      },
    ]);

    const all = await repository.findAll(testOrgId);
    const paginated = await repository.findPaginated(testOrgId);

    expect(all.some((schedule) => schedule.id === commonSchedule.id)).toBe(
      false
    );
    expect(
      paginated.data.some((schedule) => schedule.id === commonSchedule.id)
    ).toBe(false);
    expect(
      paginated.data.some((schedule) => schedule.id === itinerarySchedule.id)
    ).toBe(true);
    expect(
      await repository.findById(commonSchedule.id, testOrgId)
    ).not.toBeNull();
  });

  test('should find distinct academic years', async () => {
    const schedule = createValidSchedule();
    await repository.create(schedule);
    const years = await repository.findDistinctAcademicYears(testOrgId);
    expect(years.includes(testAcademicYearId)).toBe(true);
  });

  test('should find locked assignments', async () => {
    const schedule = createValidSchedule();
    const slots = [
      {
        scheduleId: schedule.id,
        subjectGroupId: testSubjectGroupId,
        classroomId: testClassroomId,
        dayOfWeek: 1,
        slotIndex: 1,
        duration: 1,
        conflicts: [],
      },
    ];
    await repository.createSchedulesWithSlots([{ schedule, slots }]);
    const locked = await repository.findLockedAssignments(
      testOrgId,
      testAcademicYearId,
      1,
      []
    );
    expect(locked.length).toBeGreaterThan(0);
    expect(locked[0]?.subjectGroupId).toBe(testSubjectGroupId);
    expect(locked[0]?.isLocked).toBe(true);
    expect(locked[0]?.subjectId).toBe(testSubjectId);
    expect(locked[0]?.isCommon).toBe(true);
    expect(locked[0]?.groupType).toBe('practices');
    expect(locked[0]?.numberOfStudents).toBe(50);

    const lockedExcluded = await repository.findLockedAssignments(
      testOrgId,
      testAcademicYearId,
      1,
      [schedule.id]
    );
    expect(lockedExcluded.length).toBe(0);
  });

  test('should delete schedule successfully', async () => {
    const schedule = createValidSchedule();
    await repository.create(schedule);
    await repository.delete(schedule.id, testOrgId);
    const found = await repository.findById(schedule.id, testOrgId);
    expect(found).toBeNull();
  });
});
