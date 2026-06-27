import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { RequestClassroomReservationUseCase } from './request-classroom-reservation.usecase';
import { ForbiddenError, ValidationError } from '@/core/errors/app.error';

describe('RequestClassroomReservationUseCase', () => {
  const repositoryMock = {
    findPaginated: mock(),
    findById: mock(),
    save: mock(),
    update: mock(),
    findReservationsInDateRange: mock(),
    delete: mock(),
  };

  const scheduleProviderMock = {
    areAllSchedulesPublished: mock(),
    hasSubjectInInterval: mock(),
    getClassroomScheduleSlots: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const academicYearProviderMock = {
    getMatchingPeriods: mock(),
    getAcademicYear: mock(),
  };

  const notificationProviderMock = {
    notifyReservationRequested: mock(),
    notifyReservationStatusChanged: mock(),
  };

  const useCase = new RequestClassroomReservationUseCase(
    repositoryMock,
    scheduleProviderMock,
    memberProviderMock,
    academicYearProviderMock,
    notificationProviderMock
  );

  beforeEach(() => {
    repositoryMock.save.mockReset();
    repositoryMock.findReservationsInDateRange.mockReset();
    scheduleProviderMock.areAllSchedulesPublished.mockReset();
    scheduleProviderMock.hasSubjectInInterval.mockReset();
    memberProviderMock.getMemberRole.mockReset();
    academicYearProviderMock.getMatchingPeriods.mockReset();
    academicYearProviderMock.getAcademicYear.mockReset();
    notificationProviderMock.notifyReservationRequested.mockReset();
    notificationProviderMock.notifyReservationStatusChanged.mockReset();

    academicYearProviderMock.getAcademicYear.mockResolvedValue({
      period0Start: '2020-01-01',
      period0End: '2035-12-31',
      period1Start: null,
      period1End: null,
      period2Start: null,
      period2End: null,
      centerOpeningTime: '08:00',
      centerClosingTime: '22:00',
      slotDurationMinutes: 60,
      getMatchingPeriods: () => [1],
    });
    repositoryMock.findReservationsInDateRange.mockResolvedValue([]);
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0]!;

  const validDto = {
    classroomId: 'classroom-1',
    academicYearId: 'ay-1',
    date: tomorrowStr,
    startTimeMinutes: 600,
    endTimeMinutes: 690,
    reason: 'Extra class',
  };

  test('should throw ForbiddenError if user is not a member', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue(null);
    await expect(useCase.execute('org-1', 'user-1', validDto)).rejects.toThrow(
      ForbiddenError
    );
  });

  test('should throw ValidationError if schedules are not published', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('viewer');
    academicYearProviderMock.getMatchingPeriods.mockResolvedValue([1]);
    scheduleProviderMock.areAllSchedulesPublished.mockResolvedValue(false);
    await expect(useCase.execute('org-1', 'user-1', validDto)).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ValidationError if classroom is occupied by a subject', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('viewer');
    academicYearProviderMock.getMatchingPeriods.mockResolvedValue([1]);
    scheduleProviderMock.areAllSchedulesPublished.mockResolvedValue(true);
    scheduleProviderMock.hasSubjectInInterval.mockResolvedValue(true);
    await expect(useCase.execute('org-1', 'user-1', validDto)).rejects.toThrow(
      ValidationError
    );
  });

  test('should successfully create a pending reservation', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('viewer');
    academicYearProviderMock.getMatchingPeriods.mockResolvedValue([1]);
    scheduleProviderMock.areAllSchedulesPublished.mockResolvedValue(true);
    scheduleProviderMock.hasSubjectInInterval.mockResolvedValue(false);
    const result = await useCase.execute('org-1', 'user-1', validDto);
    expect(result).toBeDefined();
    expect(result.status).toBe('PENDING');
    expect(result.classroomId).toBe('classroom-1');
    expect(result.startTimeMinutes).toBe(600);
    expect(result.endTimeMinutes).toBe(690);
    expect(result.slotIndex).toBe(2);
    expect(repositoryMock.save).toHaveBeenCalledTimes(1);
  });

  test('should correctly map Date day to system day of week', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('viewer');
    academicYearProviderMock.getMatchingPeriods.mockResolvedValue([1]);
    scheduleProviderMock.areAllSchedulesPublished.mockResolvedValue(true);
    scheduleProviderMock.hasSubjectInInterval.mockResolvedValue(false);

    const nextSunday = new Date();
    nextSunday.setDate(
      nextSunday.getDate() + ((7 - nextSunday.getDay()) % 7) + 7
    );
    const sundayStr = nextSunday.toISOString().split('T')[0]!;

    const nextMonday = new Date(nextSunday);
    nextMonday.setDate(nextMonday.getDate() + 1);
    const mondayStr = nextMonday.toISOString().split('T')[0]!;

    const sundayDto = { ...validDto, date: sundayStr };
    await useCase.execute('org-1', 'user-1', sundayDto);
    expect(scheduleProviderMock.hasSubjectInInterval).toHaveBeenCalledWith(
      'org-1',
      'ay-1',
      [1],
      'classroom-1',
      7,
      600,
      690
    );
    const mondayDto = { ...validDto, date: mondayStr };
    await useCase.execute('org-1', 'user-1', mondayDto);
    expect(scheduleProviderMock.hasSubjectInInterval).toHaveBeenCalledWith(
      'org-1',
      'ay-1',
      [1],
      'classroom-1',
      1,
      600,
      690
    );
  });

  test('should reject if requested interval is outside center opening hours', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('viewer');
    academicYearProviderMock.getMatchingPeriods.mockResolvedValue([1]);
    scheduleProviderMock.areAllSchedulesPublished.mockResolvedValue(true);

    await expect(
      useCase.execute('org-1', 'user-1', {
        ...validDto,
        startTimeMinutes: 420,
        endTimeMinutes: 500,
      })
    ).rejects.toThrow(ValidationError);
  });

  test('should reject accepted reservations that overlap by real minutes', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('viewer');
    academicYearProviderMock.getMatchingPeriods.mockResolvedValue([1]);
    scheduleProviderMock.areAllSchedulesPublished.mockResolvedValue(true);
    scheduleProviderMock.hasSubjectInInterval.mockResolvedValue(false);
    repositoryMock.findReservationsInDateRange.mockResolvedValue([
      {
        status: 'ACCEPTED',
        slotIndex: 0,
        startTimeMinutes: 630,
        endTimeMinutes: 690,
      },
    ]);

    await expect(useCase.execute('org-1', 'user-1', validDto)).rejects.toThrow(
      ValidationError
    );
  });
});
