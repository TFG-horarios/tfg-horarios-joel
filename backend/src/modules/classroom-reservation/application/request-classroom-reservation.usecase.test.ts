import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { RequestClassroomReservationUseCase } from './request-classroom-reservation.usecase';
import { ForbiddenError, ValidationError } from '@/core/errors/app.error';

describe('RequestClassroomReservationUseCase', () => {
  const repositoryMock = {
    findPaginated: mock(),
    findById: mock(),
    save: mock(),
    update: mock(),
    hasAcceptedFutureReservation: mock(),
    hasAcceptedReservationOnDate: mock(),
    findReservationsInDateRange: mock(),
  };

  const scheduleProviderMock = {
    areAllSchedulesPublished: mock(),
    hasSubjectInSlot: mock(),
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
    repositoryMock.hasAcceptedReservationOnDate.mockReset();
    scheduleProviderMock.areAllSchedulesPublished.mockReset();
    scheduleProviderMock.hasSubjectInSlot.mockReset();
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
      getMatchingPeriods: () => [1],
    });
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0]!;

  const validDto = {
    classroomId: 'classroom-1',
    academicYearId: 'ay-1',
    date: tomorrowStr,
    slotIndex: 2,
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
    scheduleProviderMock.hasSubjectInSlot.mockResolvedValue(true);
    await expect(useCase.execute('org-1', 'user-1', validDto)).rejects.toThrow(
      ValidationError
    );
  });

  test('should successfully create a pending reservation', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('viewer');
    academicYearProviderMock.getMatchingPeriods.mockResolvedValue([1]);
    scheduleProviderMock.areAllSchedulesPublished.mockResolvedValue(true);
    scheduleProviderMock.hasSubjectInSlot.mockResolvedValue(false);
    const result = await useCase.execute('org-1', 'user-1', validDto);
    expect(result).toBeDefined();
    expect(result.status).toBe('PENDING');
    expect(result.classroomId).toBe('classroom-1');
    expect(repositoryMock.save).toHaveBeenCalledTimes(1);
  });

  test('should correctly map Date day to system day of week', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('viewer');
    academicYearProviderMock.getMatchingPeriods.mockResolvedValue([1]);
    scheduleProviderMock.areAllSchedulesPublished.mockResolvedValue(true);
    scheduleProviderMock.hasSubjectInSlot.mockResolvedValue(false);

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
    expect(scheduleProviderMock.hasSubjectInSlot).toHaveBeenCalledWith(
      'org-1',
      'ay-1',
      [1],
      'classroom-1',
      7,
      2
    );
    const mondayDto = { ...validDto, date: mondayStr };
    await useCase.execute('org-1', 'user-1', mondayDto);
    expect(scheduleProviderMock.hasSubjectInSlot).toHaveBeenCalledWith(
      'org-1',
      'ay-1',
      [1],
      'classroom-1',
      1,
      2
    );
  });
});
