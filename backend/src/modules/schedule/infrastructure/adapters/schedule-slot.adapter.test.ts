import { describe, expect, test, mock } from 'bun:test';
import { ScheduleSlotAdapter } from './schedule-slot.adapter';

describe('ScheduleSlotAdapter', () => {
  const scheduleSlotRepositoryMock = {
    findActiveClassroomConfigurationsPaginated: mock(),
    findSlotsByClassroomIdAndFilters: mock(),
    findById: mock(),
    findByScheduleId: mock(),
    findLinkedSlots: mock(),
    findScheduleIdsIncludingSlot: mock(),
    clearInclusionConflictsForSlot: mock(),
    updateConflicts: mock(),
    create: mock(),
    createMany: mock(),
    update: mock(),
    delete: mock(),
  };

  const adapter = new ScheduleSlotAdapter(scheduleSlotRepositoryMock);

  test('hasUnassignedSlots should return true if any slot is unassigned', async () => {
    scheduleSlotRepositoryMock.findByScheduleId.mockResolvedValue([
      { classroomId: null, dayOfWeek: null, slotIndex: null },
      { classroomId: 'c-1', dayOfWeek: 1, slotIndex: 1 },
    ]);

    const result = await adapter.hasUnassignedSlots('sch-1');
    expect(result).toBe(true);
  });

  test('hasUnassignedSlots should return false if all slots are assigned', async () => {
    scheduleSlotRepositoryMock.findByScheduleId.mockResolvedValue([
      { classroomId: 'c-1', dayOfWeek: 1, slotIndex: 1 },
      { classroomId: 'c-2', dayOfWeek: 2, slotIndex: 2 },
    ]);

    const result = await adapter.hasUnassignedSlots('sch-1');
    expect(result).toBe(false);
  });

  test('hasUnassignedSlots should return false if no slots', async () => {
    scheduleSlotRepositoryMock.findByScheduleId.mockResolvedValue([]);
    const result = await adapter.hasUnassignedSlots('sch-1');
    expect(result).toBe(false);
  });

  test('hasUnassignedSlots should return true if a classroom is missing', async () => {
    scheduleSlotRepositoryMock.findByScheduleId.mockResolvedValue([
      { classroomId: null, dayOfWeek: 1, slotIndex: 1 },
    ]);

    expect(await adapter.hasUnassignedSlots('sch-1')).toBe(true);
  });
});
