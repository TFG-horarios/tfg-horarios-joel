import { describe, expect, test, mock } from 'bun:test';
import { ClassroomReservationScheduleAdapter } from './classroom-reservation-schedule.adapter';

describe('ClassroomReservationScheduleAdapter', () => {
  const scheduleRepositoryMock = {
    findById: mock(),
    findByScope: mock(),
    findDistinctAcademicYears: mock(),
    findAll: mock(),
    findPaginated: mock(),
    create: mock(),
    update: mock(),
    createSchedulesWithSlots: mock(),
    findLockedAssignments: mock(),
    delete: mock(),
  };

  const scheduleSlotRepositoryMock = {
    findById: mock(),
    findByScheduleId: mock(),
    findActiveClassroomConfigurationsPaginated: mock(),
    findSlotsByClassroomIdAndFilters: mock(),
    findLinkedSlots: mock(),
    findScheduleIdsIncludingSlot: mock(),
    clearInclusionConflictsForSlot: mock(),
    updateConflicts: mock(),
    create: mock(),
    createMany: mock(),
    update: mock(),
    delete: mock(),
  };

  const adapter = new ClassroomReservationScheduleAdapter(
    scheduleRepositoryMock,
    scheduleSlotRepositoryMock
  );

  test('hasSubjectInSlot should return false if no schedules found', async () => {
    scheduleRepositoryMock.findAll.mockResolvedValue([]);
    const result = await adapter.hasSubjectInSlot(
      'org-1',
      'year-1',
      [1],
      'room-1',
      1,
      1
    );
    expect(result).toBe(false);
  });

  test('hasSubjectInSlot should return true if conflict exists', async () => {
    scheduleRepositoryMock.findAll.mockResolvedValue([
      { id: 'schedule-1', academicYearId: 'year-1', period: 1 },
    ]);
    scheduleSlotRepositoryMock.findByScheduleId.mockResolvedValue([
      { classroomId: 'room-1', dayOfWeek: 1, slotIndex: 1, duration: 2 },
    ]);

    const result = await adapter.hasSubjectInSlot(
      'org-1',
      'year-1',
      [1],
      'room-1',
      1,
      2
    );
    expect(result).toBe(true);
  });

  test('hasSubjectInSlot should return false if no conflict', async () => {
    scheduleRepositoryMock.findAll.mockResolvedValue([
      { id: 'schedule-1', academicYearId: 'year-1', period: 1 },
    ]);
    scheduleSlotRepositoryMock.findByScheduleId.mockResolvedValue([
      { classroomId: 'room-1', dayOfWeek: 1, slotIndex: 1, duration: 2 },
    ]);

    const result = await adapter.hasSubjectInSlot(
      'org-1',
      'year-1',
      [1],
      'room-1',
      1,
      3
    );
    expect(result).toBe(false);
  });

  test('areAllSchedulesPublished should return false if no schedules exist', async () => {
    scheduleRepositoryMock.findAll.mockResolvedValue([]);
    const result = await adapter.areAllSchedulesPublished('org-1', 'year-1');
    expect(result).toBe(false);
  });

  test('areAllSchedulesPublished should return true if all are published', async () => {
    scheduleRepositoryMock.findAll.mockResolvedValue([
      { academicYearId: 'year-1', status: 'published' },
      { academicYearId: 'year-1', status: 'published' },
    ]);
    const result = await adapter.areAllSchedulesPublished('org-1', 'year-1');
    expect(result).toBe(true);
  });

  test('areAllSchedulesPublished should return false if one is draft', async () => {
    scheduleRepositoryMock.findAll.mockResolvedValue([
      { academicYearId: 'year-1', status: 'published' },
      { academicYearId: 'year-1', status: 'draft' },
    ]);
    const result = await adapter.areAllSchedulesPublished('org-1', 'year-1');
    expect(result).toBe(false);
  });

  test('getClassroomScheduleSlots should return mapped slots', async () => {
    scheduleRepositoryMock.findAll.mockResolvedValue([
      { id: 'schedule-1', academicYearId: 'year-1', period: 1 },
    ]);
    scheduleSlotRepositoryMock.findByScheduleId.mockResolvedValue([
      { classroomId: 'room-1', dayOfWeek: 1, slotIndex: 2, duration: 2 },
      { classroomId: 'room-2', dayOfWeek: 2, slotIndex: 1, duration: 1 },
    ]);

    const result = await adapter.getClassroomScheduleSlots(
      'org-1',
      'year-1',
      'room-1'
    );
    expect(result).toEqual([
      { dayOfWeek: 1, slotIndex: 2, duration: 2, period: 1 },
    ]);
  });
});
