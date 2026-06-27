import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { ScheduleSlotValidationAdapter } from './schedule-slot-validation.adapter';
import { ScheduleSlot } from '../../domain/schedule-slot.entity';
import { NotFoundError, ConflictError } from '@/core/errors/app.error';
import { ScheduleSlotConflictError } from '../../domain/schedule-slot-conflict.error';

describe('ScheduleSlotValidationAdapter', () => {
  const scheduleSlotRepositoryMock = {
    findById: mock(),
    findByScheduleId: mock(),
    findActiveClassroomConfigurationsPaginated: mock(),
    findSlotsByClassroomIdAndFilters: mock(),
    create: mock(),
    createMany: mock(),
    update: mock(),
    delete: mock(),
    findLinkedSlots: mock(),
    findScheduleIdsIncludingSlot: mock(),
    clearInclusionConflictsForSlot: mock(),
    updateConflicts: mock(),
  };

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
    getAvailableClassrooms: mock(),
    getGroupsInScope: mock(),
    getAcademicYearConstraints: mock(),
    getScheduleTimeConfigs: mock(),
    getMatchingPeriods: mock(),
    rejectConflictingReservationsBatch: mock(),
  };

  const adapter = new ScheduleSlotValidationAdapter(
    scheduleSlotRepositoryMock,
    scheduleRepositoryMock,
    dataProviderMock
  );

  beforeEach(() => {
    scheduleSlotRepositoryMock.findByScheduleId.mockReset();
    scheduleRepositoryMock.findById.mockReset();
    dataProviderMock.getGroupsInScope.mockReset();
    dataProviderMock.getAcademicYearConstraints.mockReset();
    dataProviderMock.getScheduleTimeConfigs.mockReset();
    dataProviderMock.getAvailableClassrooms.mockReset();
  });

  const slot = ScheduleSlot.create({
    scheduleId: 'sch-1',
    subjectGroupId: 'sg-1',
    duration: 1,
    classroomId: 'c-1',
    dayOfWeek: 1,
    slotIndex: 0,
  });

  const setupMocks = () => {
    scheduleRepositoryMock.findById.mockResolvedValue({
      id: 'sch-1',
      academicYearId: 'ay-1',
      timeConfigId: null,
      period: 1,
      degreeId: 'deg-1',
      itineraryId: null,
      courseYear: 1,
      shift: 'morning',
    });
    scheduleSlotRepositoryMock.findByScheduleId.mockResolvedValue([slot]);
    dataProviderMock.getGroupsInScope.mockResolvedValue([
      {
        subjectGroupId: 'sg-1',
        subjectId: 's-1',
        groupType: 'theory',
        isCommon: true,
        itineraryName: null,
        numberOfStudents: 50,
      },
    ]);
    dataProviderMock.getAcademicYearConstraints.mockResolvedValue({
      breakDurationMinutes: 30,
      centerOpeningTime: '08:00',
      centerClosingTime: '22:00',
      slotDurationMinutes: 60,
    });
    dataProviderMock.getScheduleTimeConfigs.mockResolvedValue([]);
    dataProviderMock.getAvailableClassrooms.mockResolvedValue([
      { id: 'c-1', capacity: 100, type: 'theory', floor: 0 },
      { id: 'c-2', capacity: 100, type: 'theory', floor: 0 },
    ]);
    scheduleSlotRepositoryMock.findSlotsByClassroomIdAndFilters.mockResolvedValue(
      []
    );
  };

  test('should pass validation if the move does not increase penalty', async () => {
    setupMocks();
    await expect(
      adapter.validateMove('org-1', slot, 'c-2', 1, 0)
    ).resolves.toBeUndefined();
  });

  test('should throw ConflictError if move introduces a new penalty (e.g. overlap)', async () => {
    setupMocks();
    const slot2 = ScheduleSlot.create({
      scheduleId: 'sch-1',
      subjectGroupId: 'sg-2',
      duration: 1,
      classroomId: 'c-2',
      dayOfWeek: 2,
      slotIndex: 1,
    });
    scheduleSlotRepositoryMock.findByScheduleId.mockResolvedValue([
      slot,
      slot2,
    ]);
    dataProviderMock.getGroupsInScope.mockResolvedValue([
      {
        subjectGroupId: 'sg-1',
        subjectId: 's-1',
        groupType: 'theory',
        isCommon: true,
        itineraryName: null,
        numberOfStudents: 50,
      },
      {
        subjectGroupId: 'sg-2',
        subjectId: 's-2',
        groupType: 'theory',
        isCommon: true,
        itineraryName: null,
        numberOfStudents: 50,
      },
    ]);
    await expect(
      adapter.validateMove('org-1', slot, 'c-2', 2, 1)
    ).rejects.toThrow(ConflictError);
  });

  test('should retain the exact group related to an overlap', async () => {
    setupMocks();
    const slot2 = ScheduleSlot.create({
      scheduleId: 'sch-1',
      subjectGroupId: 'sg-2',
      duration: 1,
      classroomId: 'c-2',
      dayOfWeek: 2,
      slotIndex: 1,
    });
    scheduleSlotRepositoryMock.findByScheduleId.mockResolvedValue([
      slot,
      slot2,
    ]);
    dataProviderMock.getGroupsInScope.mockResolvedValue([
      {
        subjectGroupId: 'sg-1',
        subjectId: 's-1',
        groupType: 'theory',
        isCommon: true,
        itineraryName: null,
        numberOfStudents: 50,
      },
      {
        subjectGroupId: 'sg-2',
        subjectId: 's-2',
        groupType: 'theory',
        isCommon: true,
        itineraryName: null,
        numberOfStudents: 50,
      },
    ]);

    try {
      await adapter.validateMove('org-1', slot, 'c-2', 2, 1);
      throw new Error('Expected overlap');
    } catch (error) {
      expect(error).toBeInstanceOf(ScheduleSlotConflictError);
      expect((error as ScheduleSlotConflictError).details[0]).toMatchObject({
        type: 'COURSE_OVERLAP_THEORY',
        assignmentId: slot.id,
        relatedSubjectGroupIds: ['sg-2'],
      });
    }
  });

  test('should throw NotFoundError if schedule is not found', async () => {
    scheduleRepositoryMock.findById.mockResolvedValue(null);
    await expect(
      adapter.validateMove('org-1', slot, 'c-2', 1, 0)
    ).rejects.toThrow(NotFoundError);
  });

  test('should throw NotFoundError if constraints are not found', async () => {
    setupMocks();
    dataProviderMock.getAcademicYearConstraints.mockResolvedValue(null);
    await expect(
      adapter.validateMove('org-1', slot, 'c-2', 1, 0)
    ).rejects.toThrow(NotFoundError);
  });

  test('should detect afternoon overlaps using global slot indexes', async () => {
    setupMocks();
    const movingSlot = ScheduleSlot.create({
      scheduleId: 'sch-1',
      subjectGroupId: 'sg-1',
      duration: 1,
      classroomId: 'c-1',
      dayOfWeek: 2,
      slotIndex: 7,
    });
    const existingSlot = ScheduleSlot.create({
      scheduleId: 'sch-1',
      subjectGroupId: 'sg-2',
      duration: 1,
      classroomId: 'c-2',
      dayOfWeek: 1,
      slotIndex: 6,
    });
    scheduleRepositoryMock.findById.mockResolvedValue({
      id: 'sch-1',
      academicYearId: 'ay-1',
      period: 1,
      degreeId: 'deg-1',
      itineraryId: null,
      courseYear: 1,
      shift: 'afternoon',
    });
    scheduleSlotRepositoryMock.findByScheduleId.mockResolvedValue([
      movingSlot,
      existingSlot,
    ]);
    dataProviderMock.getGroupsInScope.mockResolvedValue([
      {
        subjectGroupId: 'sg-1',
        subjectId: 's-1',
        groupType: 'theory',
        isCommon: true,
        itineraryName: null,
        numberOfStudents: 20,
        needsComputerLab: false,
      },
      {
        subjectGroupId: 'sg-2',
        subjectId: 's-2',
        groupType: 'theory',
        isCommon: true,
        itineraryName: null,
        numberOfStudents: 20,
        needsComputerLab: false,
      },
    ]);

    await expect(
      adapter.validateMove('org-1', movingSlot, 'c-1', 1, 6)
    ).rejects.toThrow('ERR_OVERLAP_THEORY');
  });

  test('should reject a manual move crossing the configured long break', async () => {
    setupMocks();
    const longSlot = ScheduleSlot.create({
      scheduleId: 'sch-1',
      subjectGroupId: 'sg-1',
      duration: 2,
      classroomId: 'c-1',
      dayOfWeek: 1,
      slotIndex: 0,
    });
    scheduleRepositoryMock.findById.mockResolvedValue({
      id: 'sch-1',
      academicYearId: 'ay-1',
      timeConfigId: 'cfg-1',
      period: 1,
      degreeId: 'deg-1',
      itineraryId: null,
      courseYear: 1,
      shift: 'morning',
    });
    scheduleSlotRepositoryMock.findByScheduleId.mockResolvedValue([longSlot]);
    dataProviderMock.getScheduleTimeConfigs.mockResolvedValue([
      {
        id: 'cfg-1',
        degreeId: 'deg-1',
        itineraryId: null,
        courseYear: 1,
        period: 1,
        shift: 'morning',
        startTime: '08:00',
        endTime: '12:00',
        hasBreak: true,
        breakAfterSlot: 2,
      },
    ]);

    await expect(
      adapter.validateMove('org-1', longSlot, 'c-1', 1, 1)
    ).rejects.toThrow('ERR_BREAK_CROSSING');
  });

  test('should detect room overlap by real minutes across desynchronized configs', async () => {
    setupMocks();
    const movingSlot = ScheduleSlot.create({
      scheduleId: 'sch-1',
      subjectGroupId: 'sg-1',
      duration: 1,
      classroomId: 'room-1',
      dayOfWeek: 1,
      slotIndex: 0,
    });
    const existingSlot = ScheduleSlot.create({
      scheduleId: 'sch-2',
      subjectGroupId: 'sg-2',
      duration: 1,
      classroomId: 'room-1',
      dayOfWeek: 1,
      slotIndex: 0,
    });
    scheduleRepositoryMock.findById.mockImplementation(
      async (scheduleId: string) => ({
        id: scheduleId,
        academicYearId: 'ay-1',
        timeConfigId: scheduleId === 'sch-1' ? 'cfg-1' : 'cfg-2',
        period: 1,
        degreeId: scheduleId === 'sch-1' ? 'deg-1' : 'deg-2',
        itineraryId: null,
        courseYear: 1,
        shift: 'morning',
      })
    );
    scheduleSlotRepositoryMock.findByScheduleId.mockResolvedValue([movingSlot]);
    scheduleSlotRepositoryMock.findSlotsByClassroomIdAndFilters.mockResolvedValue(
      [existingSlot]
    );
    dataProviderMock.getScheduleTimeConfigs.mockResolvedValue([
      {
        id: 'cfg-1',
        degreeId: 'deg-1',
        itineraryId: null,
        courseYear: 1,
        period: 1,
        shift: 'morning',
        startTime: '08:00',
        endTime: '12:00',
        hasBreak: false,
        breakAfterSlot: null,
      },
      {
        id: 'cfg-2',
        degreeId: 'deg-2',
        itineraryId: null,
        courseYear: 1,
        period: 1,
        shift: 'morning',
        startTime: '08:30',
        endTime: '12:30',
        hasBreak: false,
        breakAfterSlot: null,
      },
    ]);

    await expect(
      adapter.validateMove('org-1', movingSlot, 'room-1', 1, 0)
    ).rejects.toThrow('ERR_ROOM_OVERLAP');
  });
});
