import { describe, expect, test, mock } from 'bun:test';
import { GenerateScheduleUseCase } from './generate-schedule.usecase';
import { ForbiddenError } from '@/core/errors/app.error';
import type { IScheduleRepository } from '../domain/schedule.repository';

describe('GenerateScheduleUseCase', () => {
  const baseTimeConfig = {
    id: 'tc-1',
    organizationId: 'org-1',
    academicYearId: 'ay-1',
    degreeId: 'deg-1',
    itineraryId: null,
    courseYear: 1,
    period: 1,
    shift: 'morning' as const,
    startTime: '08:00',
    endTime: '14:00',
    hasBreak: false,
    breakAfterSlot: null,
  };

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
    getScheduleTimeConfigs: mock(async () => [baseTimeConfig]),
    getMatchingPeriods: mock(),
    rejectConflictingReservationsBatch: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const engineProviderMock = {
    runGeneration: mock(),
  };

  const issueProviderMock = {
    countSchedulingConflicts: mock(
      (conflicts: { type: string }[]) =>
        conflicts.filter((conflict) => !conflict.type.startsWith('UNASSIGNED'))
          .length
    ),
    isUnassignedPlacement: mock(
      (placement: {
        classroomId: string | null;
        dayOfWeek: number | null;
        slotIndex: number | null;
      }) =>
        placement.classroomId === null ||
        placement.dayOfWeek === null ||
        placement.slotIndex === null
    ),
    getUnassignedDiagnostics: mock(() => ({
      type: 'UNASSIGNED_ROOM_CAPACITY' as const,
      message: 'ERR_UNASSIGNED_ROOM_CAPACITY',
    })),
  };

  const useCase = new GenerateScheduleUseCase(
    repositoryMock,
    dataProviderMock,
    memberProviderMock,
    engineProviderMock,
    issueProviderMock
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
      breakDurationMinutes: 30,
      centerOpeningTime: '08:00',
      centerClosingTime: '22:00',
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

  test('should resolve the common time config for the requested period', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    dataProviderMock.getTargetDegreeIds.mockResolvedValueOnce(['deg-1']);
    dataProviderMock.getAvailableClassrooms.mockResolvedValueOnce([
      { id: 'c-1', capacity: 30, type: 'THEORY', floor: 0 },
    ]);
    dataProviderMock.getGroupsInScope.mockResolvedValueOnce([
      {
        subjectGroupId: 'sg-course-4-period-1',
        subjectId: 'sub-course-4-period-1',
        degreeId: 'deg-1',
        courseYear: 4,
        shift: 'morning',
        groupType: 'theory',
        isCommon: false,
        itineraryId: 'itin-a',
        numberOfStudents: 30,
      },
    ]);
    dataProviderMock.getAcademicYearConstraints.mockResolvedValueOnce({
      breakDurationMinutes: 30,
      centerOpeningTime: '08:00',
      centerClosingTime: '22:00',
      slotDurationMinutes: 60,
    });
    dataProviderMock.getScheduleTimeConfigs.mockResolvedValueOnce([
      {
        ...baseTimeConfig,
        id: 'tc-course-4-period-1-common',
        courseYear: 4,
        period: 1,
      },
      {
        ...baseTimeConfig,
        id: 'tc-course-4-period-2-common',
        courseYear: 4,
        period: 2,
        startTime: '10:00',
        endTime: '16:00',
      },
    ]);
    repositoryMock.findByScope.mockResolvedValue(null);
    repositoryMock.findLockedAssignments.mockResolvedValueOnce([]);
    engineProviderMock.runGeneration.mockResolvedValueOnce({
      assignments: [
        {
          id: 'assignment-course-4-period-1',
          subjectGroupId: 'sg-course-4-period-1',
          subjectId: 'sub-course-4-period-1',
          degreeId: 'deg-1',
          courseYear: 4,
          shift: 'morning',
          groupType: 'theory',
          isCommon: false,
          itineraryId: 'itin-a',
          itineraryName: 'A',
          numberOfStudents: 30,
          classroomId: 'c-1',
          dayOfWeek: 1,
          slotIndex: 0,
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
    expect(runGenerationCall?.[0][0]?.timeConfigId).toBe(
      'tc-course-4-period-1-common'
    );
    const persistedItems =
      repositoryMock.createSchedulesWithSlots.mock.calls.at(-1)?.[0];
    expect(persistedItems?.[0]?.schedule.timeConfigId).toBe(
      'tc-course-4-period-1-common'
    );
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
      breakDurationMinutes: 30,
      centerOpeningTime: '08:00',
      centerClosingTime: '22:00',
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
    expect(runGenerationCall?.[5]).toHaveLength(0);

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
      breakDurationMinutes: 30,
      centerOpeningTime: '08:00',
      centerClosingTime: '22:00',
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
          needsComputerLab: false,
          classroomId: null,
          dayOfWeek: null,
          slotIndex: null,
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
    expect(result.every((schedule) => schedule.unassigned === 1)).toBe(true);
    expect(result.every((schedule) => schedule.conflicts === 0)).toBe(true);
    expect(
      itineraryItems.every((item) =>
        item.inclusions?.[0]?.conflicts.some((conflict) =>
          conflict.type.startsWith('UNASSIGNED')
        )
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
      breakDurationMinutes: 30,
      centerOpeningTime: '08:00',
      centerClosingTime: '22:00',
      slotDurationMinutes: 60,
    });
    dataProviderMock.getScheduleTimeConfigs
      .mockResolvedValueOnce([
        baseTimeConfig,
        { ...baseTimeConfig, id: 'tc-period-2', period: 2 },
      ])
      .mockResolvedValueOnce([
        baseTimeConfig,
        { ...baseTimeConfig, id: 'tc-period-2', period: 2 },
      ]);
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

  test('should count an unassigned slot separately from scheduling conflicts', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    dataProviderMock.getTargetDegreeIds.mockResolvedValueOnce(['deg-1']);
    dataProviderMock.getAvailableClassrooms.mockResolvedValueOnce([
      { id: 'c-1', capacity: 30, type: 'computer_lab', floor: 0 },
    ]);
    dataProviderMock.getGroupsInScope.mockResolvedValueOnce([
      {
        subjectGroupId: 'sg-1',
        subjectId: 'sub-1',
        degreeId: 'deg-1',
        courseYear: 1,
        shift: 'morning',
        groupType: 'practices',
        isCommon: true,
        itineraryId: null,
        numberOfStudents: 40,
        needsComputerLab: true,
      },
    ]);
    dataProviderMock.getAcademicYearConstraints.mockResolvedValueOnce({
      breakDurationMinutes: 30,
      centerOpeningTime: '08:00',
      centerClosingTime: '22:00',
      slotDurationMinutes: 60,
    });
    repositoryMock.findByScope.mockResolvedValue(null);
    repositoryMock.findLockedAssignments.mockResolvedValueOnce([]);
    repositoryMock.findAll.mockResolvedValueOnce([]);
    engineProviderMock.runGeneration.mockResolvedValueOnce({
      assignments: [
        {
          id: 'assignment-1',
          subjectGroupId: 'sg-1',
          subjectId: 'sub-1',
          degreeId: 'deg-1',
          courseYear: 1,
          shift: 'morning',
          groupType: 'practices',
          isCommon: true,
          itineraryName: null,
          itineraryId: null,
          numberOfStudents: 40,
          needsComputerLab: true,
          classroomId: null,
          dayOfWeek: null,
          slotIndex: null,
          duration: 1,
          conflicts: [],
        },
      ],
      unassigned: 1,
      penalty: 0,
      hardPenalty: 0,
    });

    const result = await useCase.execute('org-1', 'user-1', {
      academicYearId: 'ay-1',
      periods: [1],
    });

    expect(result[0]?.unassigned).toBe(1);
    expect(result[0]?.conflicts).toBe(0);
    const persistedItems =
      repositoryMock.createSchedulesWithSlots.mock.calls.at(-1)?.[0];
    expect(persistedItems?.[0]?.slots[0]?.conflicts[0]?.type).toBe(
      'UNASSIGNED_ROOM_CAPACITY'
    );
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
      breakDurationMinutes: 30,
      centerOpeningTime: '08:00',
      centerClosingTime: '22:00',
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
            },
          ],
        },
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
