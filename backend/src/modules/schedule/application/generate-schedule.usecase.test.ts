import { describe, expect, test, mock } from 'bun:test';
import { GenerateScheduleUseCase } from './generate-schedule.usecase';
import { ForbiddenError } from '@/core/errors/app.error';

describe('GenerateScheduleUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findByScope: mock(),
    findDistinctAcademicYears: mock(),
    findAll: mock(),
    findPaginated: mock(),
    create: mock(),
    update: mock(),
    createSchedulesWithSlots: mock(),
  };

  const dataProviderMock = {
    getTargetDegreeIds: mock(),
    getAvailableClassrooms: mock(),
    getGroupsInScope: mock(),
    getAcademicYearConstraints: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const engineProviderMock = {
    runGeneration: mock(),
  };

  const useCase = new GenerateScheduleUseCase(
    repositoryMock,
    dataProviderMock,
    memberProviderMock,
    engineProviderMock
  );

  test('should generate schedule successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    dataProviderMock.getTargetDegreeIds.mockResolvedValueOnce(['deg-1']);
    dataProviderMock.getAvailableClassrooms.mockResolvedValueOnce([
      { id: 'c-1', capacity: 30, type: 'THEORY' },
    ]);
    dataProviderMock.getGroupsInScope.mockResolvedValueOnce([
      {
        subjectGroupId: 'sg-1',
        degreeId: 'deg-1',
        courseYear: 1,
        shift: 'morning',
        isCommon: true,
      },
    ]);
    dataProviderMock.getAcademicYearConstraints.mockResolvedValueOnce({
      morningStart: '08:00',
      morningEnd: '14:00',
      afternoonStart: '15:00',
      afternoonEnd: '21:00',
      slotDurationMinutes: 60,
    });
    engineProviderMock.runGeneration.mockResolvedValueOnce({
      assignments: [
        {
          subjectGroupId: 'sg-1',
          degreeId: 'deg-1',
          courseYear: 1,
          shift: 'morning',
          classroomId: 'c-1',
          dayOfWeek: 1,
          slotIndex: 0,
          duration: 2,
        },
      ],
      unassigned: [],
    });
    repositoryMock.findByScope.mockResolvedValueOnce(null);
    const result = await useCase.execute('org-1', 'user-1', {
      academicYearId: 'ay-1',
      periods: [1],
    });
    expect(result).toHaveLength(1);
    expect(repositoryMock.createSchedulesWithSlots).toHaveBeenCalled();
  });

  test('should return empty if no target degrees', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    dataProviderMock.getTargetDegreeIds.mockResolvedValueOnce([]);
    const result = await useCase.execute('org-1', 'user-1', {
      academicYearId: 'ay-1',
      periods: [1],
    });
    expect(result).toHaveLength(0);
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    expect(
      useCase.execute('org-1', 'user-1', {
        academicYearId: 'ay-1',
        periods: [1],
      })
    ).rejects.toThrow(ForbiddenError);
  });
});
