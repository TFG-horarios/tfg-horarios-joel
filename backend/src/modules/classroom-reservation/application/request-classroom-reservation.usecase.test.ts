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
  };

  const scheduleProviderMock = {
    areAllSchedulesPublished: mock(),
    hasSubjectInSlot: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const academicYearProviderMock = {
    getMatchingPeriods: mock(),
  };

  const useCase = new RequestClassroomReservationUseCase(
    repositoryMock,
    scheduleProviderMock,
    memberProviderMock,
    academicYearProviderMock
  );

  beforeEach(() => {
    repositoryMock.save.mockReset();
    scheduleProviderMock.areAllSchedulesPublished.mockReset();
    scheduleProviderMock.hasSubjectInSlot.mockReset();
    memberProviderMock.getMemberRole.mockReset();
    academicYearProviderMock.getMatchingPeriods.mockReset();
  });

  const validDto = {
    classroomId: 'classroom-1',
    academicYearId: 'ay-1',
    date: '2024-11-15',
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
    const sundayDto = { ...validDto, date: '2024-11-17' };
    await useCase.execute('org-1', 'user-1', sundayDto);
    expect(scheduleProviderMock.hasSubjectInSlot).toHaveBeenCalledWith(
      'org-1',
      'ay-1',
      [1],
      'classroom-1',
      6,
      2
    );
    const mondayDto = { ...validDto, date: '2024-11-18' };
    await useCase.execute('org-1', 'user-1', mondayDto);
    expect(scheduleProviderMock.hasSubjectInSlot).toHaveBeenCalledWith(
      'org-1',
      'ay-1',
      [1],
      'classroom-1',
      0,
      2
    );
  });
});
