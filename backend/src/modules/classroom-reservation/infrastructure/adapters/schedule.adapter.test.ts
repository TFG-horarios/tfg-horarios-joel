import { describe, expect, test, mock } from 'bun:test';
import { ScheduleAdapter } from './schedule.adapter';

describe('ScheduleAdapter', () => {
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

  const academicYearRepositoryMock = {
    save: mock(),
    update: mock(),
    findById: mock(),
    findByOrganizationId: mock(),
    findActiveAndFutureIds: mock(),
    isHistoric: mock(),
    delete: mock(),
  };

  const scheduleTimeConfigRepositoryMock = {
    findById: mock(),
    findAll: mock(),
    findEffective: mock(),
    save: mock(),
    update: mock(),
    delete: mock(),
    validateScope: mock(),
    isReferenced: mock(),
    findPossibilities: mock(),
  };

  const adapter = new ScheduleAdapter(
    scheduleRepositoryMock,
    scheduleSlotRepositoryMock,
    academicYearRepositoryMock,
    scheduleTimeConfigRepositoryMock
  );

  const mockTiming = () => {
    academicYearRepositoryMock.findById.mockResolvedValue({
      organizationId: 'org-1',
      slotDurationMinutes: 60,
      breakDurationMinutes: 0,
    });
    scheduleTimeConfigRepositoryMock.findById.mockResolvedValue({
      id: 'config-1',
      organizationId: 'org-1',
      academicYearId: 'year-1',
      startTime: '08:00',
      endTime: '12:00',
      hasBreak: false,
      breakAfterSlot: null,
    });
  };

  test('hasSubjectInInterval should return false if no schedules found', async () => {
    scheduleRepositoryMock.findAll.mockResolvedValue([]);
    const result = await adapter.hasSubjectInInterval(
      'org-1',
      'year-1',
      [1],
      'room-1',
      1,
      540,
      600
    );
    expect(result).toBe(false);
  });

  test('hasSubjectInInterval should return true if conflict exists by real minutes', async () => {
    mockTiming();
    scheduleRepositoryMock.findAll.mockResolvedValue([
      {
        id: 'schedule-1',
        academicYearId: 'year-1',
        period: 1,
        timeConfigId: 'config-1',
      },
    ]);
    scheduleSlotRepositoryMock.findByScheduleId.mockResolvedValue([
      { classroomId: 'room-1', dayOfWeek: 1, slotIndex: 1, duration: 1 },
    ]);

    const result = await adapter.hasSubjectInInterval(
      'org-1',
      'year-1',
      [1],
      'room-1',
      1,
      510,
      570
    );
    expect(result).toBe(true);
  });

  test('hasSubjectInInterval should return false if no conflict', async () => {
    mockTiming();
    scheduleRepositoryMock.findAll.mockResolvedValue([
      {
        id: 'schedule-1',
        academicYearId: 'year-1',
        period: 1,
        timeConfigId: 'config-1',
      },
    ]);
    scheduleSlotRepositoryMock.findByScheduleId.mockResolvedValue([
      { classroomId: 'room-1', dayOfWeek: 1, slotIndex: 1, duration: 2 },
    ]);

    const result = await adapter.hasSubjectInInterval(
      'org-1',
      'year-1',
      [1],
      'room-1',
      1,
      660,
      720
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
    mockTiming();
    scheduleRepositoryMock.findAll.mockResolvedValue([
      {
        id: 'schedule-1',
        academicYearId: 'year-1',
        period: 1,
        timeConfigId: 'config-1',
      },
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
      {
        dayOfWeek: 1,
        slotIndex: 2,
        duration: 2,
        period: 1,
        startTimeMinutes: 600,
        endTimeMinutes: 720,
      },
    ]);
  });
});
