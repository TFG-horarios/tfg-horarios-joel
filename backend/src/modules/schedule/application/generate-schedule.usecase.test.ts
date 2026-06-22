import { describe, expect, test, mock } from 'bun:test';
import { GenerateScheduleUseCase } from './generate-schedule.usecase';
import { ForbiddenError } from '@/core/errors/app.error';
import type { IScheduleRepository } from '../domain/schedule.repository';

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
      { id: 'c-1', capacity: 30, type: 'THEORY', floor: 0 },
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
      { id: 'c-1', capacity: 30, type: 'THEORY', floor: 0 },
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

    const runGenerationCall =
      engineProviderMock.runGeneration.mock.calls.at(-1);
    expect(runGenerationCall?.[0]).toHaveLength(1);
    expect(runGenerationCall?.[6]).toHaveLength(0);

    const persistCall =
      repositoryMock.createSchedulesWithSlots.mock.calls.at(-1);
    expect(persistCall?.[0][0].slots).toHaveLength(1);
  });

  test('should persist common slots once and include them in each itinerary schedule', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    dataProviderMock.getTargetDegreeIds.mockResolvedValueOnce(['deg-1']);
    dataProviderMock.getAvailableClassrooms.mockResolvedValueOnce([
      { id: 'c-1', capacity: 60, type: 'theory', floor: 0 },
      { id: 'c-2', capacity: 30, type: 'theory', floor: 0 },
    ]);
    dataProviderMock.getGroupsInScope.mockResolvedValueOnce([
      {
        subjectGroupId: 'sg-common',
        subjectId: 'sub-common',
        degreeId: 'deg-1',
        courseYear: 1,
        shift: 'morning',
        groupType: 'theory',
        isCommon: true,
        itineraryId: null,
      },
      {
        subjectGroupId: 'sg-a',
        subjectId: 'sub-a',
        degreeId: 'deg-1',
        courseYear: 1,
        shift: 'morning',
        groupType: 'theory',
        isCommon: false,
        itineraryId: 'itin-a',
      },
      {
        subjectGroupId: 'sg-b',
        subjectId: 'sub-b',
        degreeId: 'deg-1',
        courseYear: 1,
        shift: 'morning',
        groupType: 'theory',
        isCommon: false,
        itineraryId: 'itin-b',
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
    repositoryMock.findLockedAssignments.mockResolvedValueOnce([]);
    engineProviderMock.runGeneration.mockResolvedValueOnce({
      assignments: [
        {
          id: 'assignment-common',
          subjectGroupId: 'sg-common',
          subjectId: 'sub-common',
          degreeId: 'deg-1',
          courseYear: 1,
          shift: 'morning',
          groupType: 'theory',
          isCommon: true,
          itineraryName: null,
          itineraryId: null,
          numberOfStudents: 60,
          classroomId: 'c-1',
          dayOfWeek: 1,
          slotIndex: 0,
          duration: 1,
          conflicts: [],
        },
        {
          id: 'assignment-a',
          subjectGroupId: 'sg-a',
          subjectId: 'sub-a',
          degreeId: 'deg-1',
          courseYear: 1,
          shift: 'morning',
          groupType: 'theory',
          isCommon: false,
          itineraryName: 'A',
          itineraryId: 'itin-a',
          numberOfStudents: 30,
          classroomId: 'c-2',
          dayOfWeek: 1,
          slotIndex: 1,
          duration: 1,
          conflicts: [],
        },
        {
          id: 'assignment-b',
          subjectGroupId: 'sg-b',
          subjectId: 'sub-b',
          degreeId: 'deg-1',
          courseYear: 1,
          shift: 'morning',
          groupType: 'theory',
          isCommon: false,
          itineraryName: 'B',
          itineraryId: 'itin-b',
          numberOfStudents: 30,
          classroomId: 'c-2',
          dayOfWeek: 2,
          slotIndex: 1,
          duration: 1,
          conflicts: [],
        },
      ],
      penalty: 0,
      hardPenalty: 0,
    });

    const result = await useCase.execute('org-1', 'user-1', {
      academicYearId: 'ay-1',
      periods: [1],
    });

    expect(result).toHaveLength(2);
    expect(result.every((schedule) => schedule.itineraryId)).toBe(true);
    const persistCall =
      repositoryMock.createSchedulesWithSlots.mock.calls.at(-1);
    const items = (persistCall?.[0] ?? []) as Parameters<
      IScheduleRepository['createSchedulesWithSlots']
    >[0];
    const commonItem = items.find((item) => item.schedule.itineraryId === null);
    const itineraryItems = items.filter(
      (item) => item.schedule.itineraryId !== null
    );

    expect(commonItem?.slots).toHaveLength(1);
    expect(commonItem?.slots[0]?.subjectGroupId).toBe('sg-common');
    expect(itineraryItems).toHaveLength(2);
    expect(
      itineraryItems.every(
        (item) =>
          item.slots.length === 1 &&
          item.slots[0]?.subjectGroupId !== 'sg-common' &&
          (item.inclusions ?? []).length === 1 &&
          item.inclusions?.[0]?.slotId === commonItem?.slots[0]?.id
      )
    ).toBe(true);
  });

  test('should not persist any period when one generation fails', async () => {
    const persistCallsBefore =
      repositoryMock.createSchedulesWithSlots.mock.calls.length;

    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    dataProviderMock.getTargetDegreeIds.mockResolvedValueOnce(['deg-1']);
    dataProviderMock.getAvailableClassrooms.mockResolvedValueOnce([]);
    dataProviderMock.getGroupsInScope
      .mockResolvedValueOnce([
        {
          subjectGroupId: 'sg-period-1',
          subjectId: 'sub-period-1',
          degreeId: 'deg-1',
          courseYear: 1,
          shift: 'morning',
          groupType: 'theory',
          isCommon: true,
          itineraryId: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          subjectGroupId: 'sg-period-2',
          subjectId: 'sub-period-2',
          degreeId: 'deg-1',
          courseYear: 1,
          shift: 'morning',
          groupType: 'theory',
          isCommon: true,
          itineraryId: null,
        },
      ]);
    dataProviderMock.getAcademicYearConstraints.mockResolvedValue({
      morningStart: '08:00',
      morningEnd: '14:00',
      afternoonStart: '15:00',
      afternoonEnd: '21:00',
      slotDurationMinutes: 60,
    });
    repositoryMock.findByScope.mockResolvedValue(null);
    repositoryMock.findLockedAssignments.mockResolvedValue([]);
    engineProviderMock.runGeneration
      .mockResolvedValueOnce({
        assignments: [
          {
            id: 'assignment-period-1',
            subjectGroupId: 'sg-period-1',
            subjectId: 'sub-period-1',
            degreeId: 'deg-1',
            courseYear: 1,
            shift: 'morning',
            groupType: 'theory',
            isCommon: true,
            itineraryName: null,
            itineraryId: null,
            numberOfStudents: 30,
            classroomId: null,
            dayOfWeek: null,
            slotIndex: null,
            duration: 1,
            conflicts: [],
          },
        ],
        penalty: 0,
        hardPenalty: 0,
      })
      .mockRejectedValueOnce(new Error('period 2 failed'));

    await expect(
      useCase.execute('org-1', 'user-1', {
        academicYearId: 'ay-1',
        periods: [1, 2],
      })
    ).rejects.toThrow('period 2 failed');

    expect(repositoryMock.createSchedulesWithSlots.mock.calls).toHaveLength(
      persistCallsBefore
    );
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

  test('should persist a solution even with hard conflicts', async () => {
    const persistCallsBefore =
      repositoryMock.createSchedulesWithSlots.mock.calls.length;

    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    dataProviderMock.getTargetDegreeIds.mockResolvedValueOnce(['deg-1']);
    dataProviderMock.getAvailableClassrooms.mockResolvedValueOnce([
      { id: 'c-1', capacity: 30, type: 'theory', floor: 0 },
    ]);
    dataProviderMock.getGroupsInScope.mockResolvedValueOnce([
      {
        subjectGroupId: 'sg-1',
        subjectId: 'sub-1',
        degreeId: 'deg-1',
        courseYear: 1,
        shift: 'morning',
        groupType: 'theory',
        isCommon: true,
        itineraryId: null,
      },
    ]);
    dataProviderMock.getAcademicYearConstraints.mockResolvedValueOnce({
      morningStart: '08:00',
      morningEnd: '14:00',
      afternoonStart: '15:00',
      afternoonEnd: '21:00',
      slotDurationMinutes: 60,
    });
    repositoryMock.findByScope.mockResolvedValueOnce(null);
    repositoryMock.findLockedAssignments.mockResolvedValueOnce([]);
    engineProviderMock.runGeneration.mockResolvedValueOnce({
      assignments: [
        {
          id: 'conflict-assignment',
          subjectGroupId: 'sg-1',
          subjectId: 'sub-1',
          degreeId: 'deg-1',
          courseYear: 1,
          shift: 'morning',
          groupType: 'theory',
          isCommon: true,
          itineraryName: null,
          itineraryId: null,
          numberOfStudents: 30,
          classroomId: 'c-1',
          dayOfWeek: 1,
          slotIndex: 0,
          duration: 1,
          conflicts: [
            {
              type: 'ROOM_OVERLAP',
              message: 'Conflict',
              severity: 'high',
            }
          ],
        }
      ],
      penalty: 1000,
      hardPenalty: 1000,
    });

    const result = await useCase.execute('org-1', 'user-1', {
      academicYearId: 'ay-1',
      periods: [1],
    });

    expect(result).toHaveLength(1);

    expect(repositoryMock.createSchedulesWithSlots.mock.calls).toHaveLength(
      persistCallsBefore + 1
    );
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
