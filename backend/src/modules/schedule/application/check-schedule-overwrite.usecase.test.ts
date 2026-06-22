import { describe, expect, test, mock } from 'bun:test';
import { CheckScheduleOverwriteUseCase } from './check-schedule-overwrite.usecase';
import { ForbiddenError } from '@/core/errors/app.error';
import { Schedule } from '../domain/schedule.entity';

describe('CheckScheduleOverwriteUseCase', () => {
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

  const dataProviderMock = {
    getTargetDegreeIds: mock(),
    getGroupsInScope: mock(),
    getAvailableClassrooms: mock(),
    getAcademicYearConstraints: mock(),
    rejectConflictingReservationsBatch: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const useCase = new CheckScheduleOverwriteUseCase(
    scheduleRepositoryMock,
    dataProviderMock,
    memberProviderMock
  );

  test('should return overwritten schedules correctly', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('admin');
    dataProviderMock.getTargetDegreeIds.mockResolvedValue(['deg-1']);
    dataProviderMock.getAvailableClassrooms.mockResolvedValueOnce([
      { id: 'c-1', capacity: 30, type: 'THEORY', floor: 0 },
    ]);
    dataProviderMock.getGroupsInScope.mockResolvedValue([
      {
        degreeId: 'deg-1',
        isCommon: true,
        itineraryId: 'itin-1',
        courseYear: 1,
        shift: 'morning',
      },
    ]);

    const existingSchedule = Schedule.create({
      organizationId: 'org-1',
      academicYearId: 'year-1',
      degreeId: 'deg-1',
      itineraryId: 'itin-1',
      courseYear: 1,
      period: 1,
      shift: 'morning',
      status: 'draft',
    });
    scheduleRepositoryMock.findByScope.mockResolvedValue(existingSchedule);

    const result = await useCase.execute('org-1', 'user-1', {
      academicYearId: 'year-1',
      degreeIds: ['deg-1'],
      itineraryIds: [],
      courseYears: [1],
      periods: [1],
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(existingSchedule.id);
  });

  test('should return empty array if no degrees found', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('admin');
    dataProviderMock.getTargetDegreeIds.mockResolvedValue([]);

    const result = await useCase.execute('org-1', 'user-1', {
      academicYearId: 'year-1',
      degreeIds: [],
      itineraryIds: [],
      courseYears: [1],
      periods: [1],
    });

    expect(result).toHaveLength(0);
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('VIEWER');

    expect(
      useCase.execute('org-1', 'user-1', {
        academicYearId: 'year-1',
        degreeIds: [],
        itineraryIds: [],
        courseYears: [1],
        periods: [1],
      })
    ).rejects.toThrow(ForbiddenError);
  });
});
