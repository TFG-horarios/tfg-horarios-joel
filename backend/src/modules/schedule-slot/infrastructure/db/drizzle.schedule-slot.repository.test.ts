import { describe, expect, test, beforeAll, beforeEach } from 'bun:test';
import { DrizzleScheduleSlotRepository } from './drizzle.schedule-slot.repository';
import { ScheduleSlot } from '../../domain/schedule-slot.entity';
import { ConflictError } from '@/core/errors/app.error';
import { setupTestDb, cleanTestDb, testDb } from '@/tests/setup-db';
import {
  seedTestDb,
  testSubjectGroupId,
  testClassroomId,
  testScheduleId,
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
});
