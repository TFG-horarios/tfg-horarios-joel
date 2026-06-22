import { describe, expect, test, beforeAll, beforeEach } from 'bun:test';
import { DrizzleScheduleSlotRepository } from './drizzle.schedule-slot.repository';
import { DrizzleScheduleRepository } from '@/modules/schedule/infrastructure/db/drizzle.schedule.repository';
import { ScheduleSlot } from '../../domain/schedule-slot.entity';
import { Schedule } from '@/modules/schedule/domain/schedule.entity';
import { ConflictError } from '@/core/errors/app.error';
import { setupTestDb, cleanTestDb, testDb } from '@/tests/setup-db';
import {
  seedTestDb,
  testSubjectGroupId,
  testClassroomId,
  testScheduleId,
  testOrgId,
  testAcademicYearId,
  testDegreeId,
  testItineraryId,
} from '@/tests/seed-db';

describe('DrizzleScheduleSlotRepository Integration', () => {
  let repository: DrizzleScheduleSlotRepository;

  beforeAll(async () => {
    await setupTestDb();
    repository = new DrizzleScheduleSlotRepository(testDb);
  });

  beforeEach(async () => {
    await cleanTestDb();
    await seedTestDb(testDb);
  });

  const createValidSlot = () =>
    ScheduleSlot.create({
      scheduleId: testScheduleId,
      subjectGroupId: testSubjectGroupId,
      classroomId: testClassroomId,
      dayOfWeek: 1,
      slotIndex: 1,
      duration: 1,
    });

  test('should create and retrieve a slot by ID', async () => {
    const slot = createValidSlot();
    await repository.create(slot);
    const foundSlot = await repository.findById(slot.id);
    expect(foundSlot).not.toBeNull();
    expect(foundSlot?.id).toBe(slot.id);
    expect(foundSlot?.dayOfWeek).toBe(1);
    expect(foundSlot?.slotIndex).toBe(1);
  });

  test('should find slots by schedule ID', async () => {
    const slot1 = ScheduleSlot.create({
      scheduleId: testScheduleId,
      subjectGroupId: testSubjectGroupId,
      classroomId: testClassroomId,
      dayOfWeek: 1,
      slotIndex: 1,
      duration: 1,
    });
    const slot2 = ScheduleSlot.create({
      scheduleId: testScheduleId,
      subjectGroupId: testSubjectGroupId,
      classroomId: testClassroomId,
      dayOfWeek: 2,
      slotIndex: 2,
      duration: 1,
    });
    await repository.createMany([slot1, slot2]);
    const foundSlots = await repository.findByScheduleId(testScheduleId);
    expect(foundSlots.length).toBe(2);
    expect(foundSlots.map((s) => s.id)).toContain(slot1.id);
    expect(foundSlots.map((s) => s.id)).toContain(slot2.id);
  });

  test('should throw ConflictError on duplicate classroom assignment at same time', async () => {
    const slot = createValidSlot();
    await repository.create(slot);
    const slotDuplicate = ScheduleSlot.create({
      scheduleId: testScheduleId,
      subjectGroupId: testSubjectGroupId,
      classroomId: testClassroomId,
      dayOfWeek: 1,
      slotIndex: 1,
      duration: 1,
    });
    await expect(repository.create(slotDuplicate)).rejects.toThrow(
      ConflictError
    );
  });

  test('should update a slot successfully', async () => {
    const slot = createValidSlot();
    await repository.create(slot);
    slot.assignLocationAndTime(null, 2, 2);
    await repository.update(slot);
    const updatedSlot = await repository.findById(slot.id);
    expect(updatedSlot?.dayOfWeek).toBe(2);
    expect(updatedSlot?.slotIndex).toBe(2);
    expect(updatedSlot?.classroomId).toBeNull();
  });

  test('should delete a slot successfully', async () => {
    const slot = createValidSlot();
    await repository.create(slot);
    await repository.delete(slot.id);
    const foundSlot = await repository.findById(slot.id);
    expect(foundSlot).toBeNull();
  });

  test('should find active classroom configurations paginated', async () => {
    const slot = createValidSlot();
    await repository.create(slot);
    const result = await repository.findActiveClassroomConfigurationsPaginated(
      testOrgId,
      { page: 1, limit: 10 }
    );
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0]?.classroomId).toBe(testClassroomId);
  });

  test('should find linked slots', async () => {
    const slot = createValidSlot();
    await repository.create(slot);
    const result = await repository.findLinkedSlots(
      testSubjectGroupId,
      testAcademicYearId,
      'morning',
      testClassroomId,
      1,
      1,
      1
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]?.id).toBe(slot.id);
  });

  test('should compose itinerary schedules with canonical common slots', async () => {
    const commonSlot = createValidSlot();
    await repository.create(commonSlot);

    const itinerarySchedule = Schedule.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      itineraryId: testItineraryId,
      academicYearId: testAcademicYearId,
      shift: 'morning',
      courseYear: 1,
      period: 1,
    });
    const scheduleRepository = new DrizzleScheduleRepository(testDb);
    await scheduleRepository.createSchedulesWithSlots([
      {
        schedule: itinerarySchedule,
        slots: [],
        inclusions: [
          {
            scheduleId: itinerarySchedule.id,
            slotId: commonSlot.id,
            conflicts: [],
          },
        ],
      },
    ]);

    const slots = await repository.findByScheduleId(itinerarySchedule.id);

    expect(slots).toHaveLength(1);
    expect(slots[0]?.id).toBe(commonSlot.id);
    expect(slots[0]?.scheduleId).toBe(itinerarySchedule.id);
    expect(slots[0]?.ownerScheduleId).toBe(testScheduleId);
    expect(slots[0]?.isSharedCommon).toBe(true);

    const includedSlot = slots[0]!;
    includedSlot.updateConflicts([
      { type: 'COURSE_OVERLAP_THEORY', message: 'ERR_OVERLAP_THEORY' },
    ]);
    await repository.updateConflicts(includedSlot);

    const refreshedIncludedSlot = (
      await repository.findByScheduleId(itinerarySchedule.id)
    )[0];
    const canonicalSlot = await repository.findById(commonSlot.id);

    expect(refreshedIncludedSlot?.conflicts).toEqual([
      { type: 'COURSE_OVERLAP_THEORY', message: 'ERR_OVERLAP_THEORY' },
    ]);
    expect(canonicalSlot?.conflicts).toEqual([]);
  });
});
