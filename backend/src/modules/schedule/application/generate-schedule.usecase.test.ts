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
    findLockedAssignments: mock(),
    delete: mock(),
  };

  const dataProviderMock = {
    getTargetDegreeIds: mock(),
    getAvailableClassrooms: mock(),
    getGroupsInScope: mock(),
    getAcademicYearConstraints: mock(),
    rejectConflictingReservationsBatch: mock(),
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
    repositoryMock.findLockedAssignments.mockResolvedValueOnce([]);
    repositoryMock.findByScope.mockResolvedValueOnce(null);
    const result = await useCase.execute('org-1', 'user-1', {
      academicYearId: 'ay-1',
      periods: [1],
    });
    expect(result).toHaveLength(1);
    expect(repositoryMock.createSchedulesWithSlots).toHaveBeenCalled();
  });

  test('should not lock common assignments that belong to the generation scope', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    dataProviderMock.getTargetDegreeIds.mockResolvedValueOnce(['deg-1']);
    dataProviderMock.getAvailableClassrooms.mockResolvedValueOnce([
      { id: 'c-1', capacity: 30, type: 'THEORY' },
    ]);
    dataProviderMock.getGroupsInScope.mockResolvedValueOnce([
      {
        subjectGroupId: 'sg-common',
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
    repositoryMock.findByScope.mockResolvedValue(null);
    repositoryMock.findLockedAssignments.mockResolvedValueOnce([
      {
        id: 'locked-1',
        subjectGroupId: 'sg-common',
        subjectId: 'sub-common',
        degreeId: 'deg-1',
        courseYear: 1,
        shift: 'morning',
        groupType: 'theory',
        isCommon: true,
        itineraryName: null,
        numberOfStudents: 30,
        classroomId: 'c-1',
        dayOfWeek: 1,
        slotIndex: 0,
        duration: 1,
        isLocked: true,
      },
      {
        id: 'locked-2',
        subjectGroupId: 'sg-common',
        subjectId: 'sub-common',
        degreeId: 'deg-1',
        courseYear: 1,
        shift: 'morning',
        groupType: 'theory',
        isCommon: true,
        itineraryName: null,
        numberOfStudents: 30,
        classroomId: 'c-1',
        dayOfWeek: 1,
        slotIndex: 0,
        duration: 1,
        isLocked: true,
      },
    ]);
    engineProviderMock.runGeneration.mockResolvedValueOnce({
      assignments: [
        {
          id: 'generated-common',
          subjectGroupId: 'sg-common',
          subjectId: 'sub-common',
          degreeId: 'deg-1',
          courseYear: 1,
          shift: 'morning',
          groupType: 'theory',
          isCommon: true,
          itineraryName: null,
          numberOfStudents: 30,
          classroomId: 'c-1',
          dayOfWeek: 2,
          slotIndex: 1,
          duration: 1,
          conflicts: [],
        },
      ],
      penalty: 0,
      hardPenalty: 0,
    });

    await useCase.execute('org-1', 'user-1', {
      academicYearId: 'ay-1',
      periods: [1],
    });

    const runGenerationCall = engineProviderMock.runGeneration.mock.calls.at(-1);
    expect(runGenerationCall?.[0]).toHaveLength(1);
    expect(runGenerationCall?.[6]).toHaveLength(0);

    const persistCall =
      repositoryMock.createSchedulesWithSlots.mock.calls.at(-1);
    expect(persistCall?.[0][0].slots).toHaveLength(1);
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
