import { describe, expect, test, mock } from 'bun:test';
import { ScheduleSlotAdapter } from './schedule-slot.adapter';

describe('ClassroomScheduleSlotAdapter', () => {
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

  test('findActiveClassroomConfigurationsPaginated delegates to repository', async () => {
    scheduleSlotRepositoryMock.findActiveClassroomConfigurationsPaginated.mockResolvedValue(
      {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      }
    );
    const result =
      await adapter.findActiveClassroomConfigurationsPaginated('org-1');
    expect(result).toEqual({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    });
    expect(
      scheduleSlotRepositoryMock.findActiveClassroomConfigurationsPaginated
    ).toHaveBeenCalledWith('org-1', undefined);
  });

  test('findSlotsByClassroomIdAndFilters delegates to repository', async () => {
    scheduleSlotRepositoryMock.findSlotsByClassroomIdAndFilters.mockResolvedValue(
      []
    );
    const result = await adapter.findUniqueSlotsByClassroomIdAndFilters(
      'room-1',
      'org-1'
    );
    expect(result).toEqual([]);
    expect(
      scheduleSlotRepositoryMock.findSlotsByClassroomIdAndFilters
    ).toHaveBeenCalledWith('room-1', 'org-1', undefined);
  });
});
