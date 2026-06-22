import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { ScheduleSlotValidationAdapter } from './schedule-slot-validation.adapter';
import { ScheduleSlot } from '../../domain/schedule-slot.entity';
import { NotFoundError, ConflictError } from '@/core/errors/app.error';

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
    rejectConflictingReservationsBatch: mock(),
  };

  const reservationRepositoryMock = {
    hasAcceptedFutureReservation: mock(),
    findById: mock(),
    save: mock(),
    update: mock(),
    findPaginated: mock(),
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
    dataProviderMock.getAvailableClassrooms.mockReset();
    reservationRepositoryMock.hasAcceptedFutureReservation.mockReset();
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
      morningStart: '08:00',
      morningEnd: '14:00',
      afternoonStart: '15:00',
      afternoonEnd: '21:00',
      slotDurationMinutes: 60,
    });
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
});
