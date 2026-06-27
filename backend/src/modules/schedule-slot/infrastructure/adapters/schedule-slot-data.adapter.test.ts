import { describe, expect, test, mock } from 'bun:test';
import { ScheduleSlotDataAdapter } from './schedule-slot-data.adapter';
import type { CreateNotificationUseCase } from '@/modules/notification/application/create-notification.usecase';

describe('ScheduleSlotDataAdapter', () => {
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

  const scheduleDataProviderMock = {
    getTargetDegreeIds: mock(),
    getAvailableClassrooms: mock(),
    getGroupsInScope: mock(),
    getAcademicYearConstraints: mock(),
    getScheduleTimeConfigs: mock(),
    getMatchingPeriods: mock(),
    rejectConflictingReservationsBatch: mock(),
  };

  const reservationRepositoryMock = {
    findById: mock(),
    save: mock(),
    update: mock(),
    findPaginated: mock(),
    findReservationsInDateRange: mock(),
  };

  const createNotificationUseCaseMock = {
    execute: mock(),
  } as unknown as CreateNotificationUseCase;

  const adapter = new ScheduleSlotDataAdapter(
    scheduleRepositoryMock,
    scheduleDataProviderMock,
    reservationRepositoryMock,
    createNotificationUseCaseMock
  );

  test('getScheduleContext should return null if schedule not found', async () => {
    scheduleRepositoryMock.findById.mockResolvedValue(null);
    const result = await adapter.getScheduleContext('sch-1', 'org-1');
    expect(result).toBeNull();
  });

  test('getScheduleContext should return context if schedule found', async () => {
    scheduleRepositoryMock.findById.mockResolvedValue({
      academicYearId: 'year-1',
      period: 1,
      shift: 'morning',
    });
    const result = await adapter.getScheduleContext('sch-1', 'org-1');
    expect(result).toEqual({
      academicYearId: 'year-1',
      period: 1,
      shift: 'morning',
      timeConfigId: null,
    });
  });

  test('isGroupCommon should return true if group is common', async () => {
    scheduleRepositoryMock.findById.mockResolvedValue({
      period: 1,
      degreeId: 'deg-1',
      courseYear: 1,
    });
    scheduleDataProviderMock.getGroupsInScope.mockResolvedValue([
      { subjectGroupId: 'sg-1', isCommon: true },
    ]);
    const result = await adapter.isGroupCommon('sg-1', 'sch-1', 'org-1');
    expect(result).toBe(true);
  });

  test('unpublishSchedule should set draft if published', async () => {
    const schedule = { status: 'published', markAsDraft: mock() };
    scheduleRepositoryMock.findById.mockResolvedValue(schedule);
    await adapter.unpublishSchedule('sch-1', 'org-1');
    expect(schedule.markAsDraft).toHaveBeenCalled();
    expect(scheduleRepositoryMock.update).toHaveBeenCalledWith(schedule);
  });

  test('rejectConflictingReservations should reject and notify if conflict', async () => {
    const reservation = {
      status: 'ACCEPTED',
      academicYearId: 'year-1',
      date: '2025-01-01',
      slotIndex: 2,
      startTimeMinutes: 600,
      endTimeMinutes: 660,
      requesterUserId: 'user-1',
      reject: mock(),
    };
    reservationRepositoryMock.findReservationsInDateRange.mockResolvedValue([
      reservation,
    ]);
    scheduleDataProviderMock.getMatchingPeriods.mockResolvedValue([1]);
    scheduleDataProviderMock.getAcademicYearConstraints.mockResolvedValue({
      slotDurationMinutes: 60,
      breakDurationMinutes: 0,
    });
    scheduleDataProviderMock.getScheduleTimeConfigs.mockResolvedValue([
      {
        id: 'tc-1',
        startTime: '09:00',
        endTime: '14:00',
        hasBreak: false,
        breakAfterSlot: null,
      },
    ]);

    await adapter.rejectConflictingReservations(
      'org-1',
      'year-1',
      1,
      'room-1',
      3,
      1,
      2,
      'tc-1'
    );

    expect(reservation.reject).toHaveBeenCalled();
    expect(reservationRepositoryMock.update).toHaveBeenCalledWith(reservation);
    expect(createNotificationUseCaseMock.execute).toHaveBeenCalled();
  });
});
