import { beforeEach, describe, expect, test, mock } from 'bun:test';
import { UpdateScheduleSlotUseCase } from './update-schedule-slot.usecase';
import { ScheduleSlot } from '../domain/schedule-slot.entity';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '@/core/errors/app.error';

describe('UpdateScheduleSlotUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findByScheduleId: mock(),
    create: mock(),
    createMany: mock(),
    update: mock(),
    delete: mock(),
    findActiveClassroomConfigurationsPaginated: mock(),
    findSlotsByClassroomIdAndFilters: mock(),
    findLinkedSlots: mock(),
    findScheduleIdsIncludingSlot: mock(),
    clearInclusionConflictsForSlot: mock(),
    updateConflicts: mock(),
  };

  const dataProviderMock = {
    getScheduleContext: mock(),
    isGroupCommon: mock(),
    unpublishSchedule: mock(),
    rejectConflictingReservations: mock(),
    updateScheduleConflictsAndUnassignedCount: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const validationProviderMock = {
    validateMove: mock(),
  };

  const useCase = new UpdateScheduleSlotUseCase(
    repositoryMock,
    dataProviderMock,
    memberProviderMock,
    validationProviderMock
  );

  beforeEach(() => {
    for (const value of Object.values(repositoryMock)) value.mockReset();
    for (const value of Object.values(dataProviderMock)) value.mockReset();
    for (const value of Object.values(memberProviderMock)) value.mockReset();
    for (const value of Object.values(validationProviderMock))
      value.mockReset();
  });

  test('should update schedule slot successfully', async () => {
    const slot = ScheduleSlot.create({
      scheduleId: 'sch-1',
      subjectGroupId: 'sg-1',
      duration: 2,
    });
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce(slot);
    dataProviderMock.getScheduleContext.mockResolvedValueOnce({
      academicYearId: 'ay-1',
      period: 1,
      shift: 'morning',
    });
    dataProviderMock.isGroupCommon.mockResolvedValueOnce(true);
    repositoryMock.findScheduleIdsIncludingSlot.mockResolvedValueOnce([]);
    validationProviderMock.validateMove.mockResolvedValueOnce(undefined);
    repositoryMock.findByScheduleId.mockResolvedValueOnce([slot]);
    const dto = { classroomId: 'c-2', dayOfWeek: 2, slotIndex: 1 };
    const result = await useCase.execute('org-1', 'user-1', slot.id, dto);
    expect(result.classroomId).toBe('c-2');
    expect(result.dayOfWeek).toBe(2);
    expect(result.slotIndex).toBe(1);
    expect(validationProviderMock.validateMove).toHaveBeenCalledWith(
      'org-1',
      slot,
      'c-2',
      2,
      1
    );
    expect(repositoryMock.update).toHaveBeenCalledWith(slot);
  });

  test('should update only provided fields', async () => {
    const slot = ScheduleSlot.reconstitute({
      id: 'slot-1',
      scheduleId: 'sch-1',
      subjectGroupId: 'sg-1',
      duration: 2,
      classroomId: 'c-1',
      dayOfWeek: 1,
      slotIndex: 0,
      conflicts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce(slot);
    dataProviderMock.getScheduleContext.mockResolvedValueOnce({
      academicYearId: 'ay-1',
      period: 1,
      shift: 'morning',
    });
    dataProviderMock.isGroupCommon.mockResolvedValueOnce(false);
    validationProviderMock.validateMove.mockResolvedValueOnce(undefined);
    repositoryMock.findByScheduleId.mockResolvedValueOnce([slot]);

    const dto = { classroomId: 'c-2' };
    const result = await useCase.execute('org-1', 'user-1', slot.id, dto);
    expect(result.classroomId).toBe('c-2');
    expect(result.dayOfWeek).toBe(1);
    expect(result.slotIndex).toBe(0);
    expect(validationProviderMock.validateMove).toHaveBeenCalledWith(
      'org-1',
      slot,
      'c-2',
      1,
      0
    );
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    expect(useCase.execute('org-1', 'user-1', 'slot-1', {})).rejects.toThrow(
      ForbiddenError
    );
  });

  test('should throw NotFoundError if schedule slot does not exist', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'user-1', 'slot-1', {})).rejects.toThrow(
      NotFoundError
    );
  });

  test('should allow unassigning a slot and persist its diagnostic', async () => {
    const slot = ScheduleSlot.create({
      scheduleId: 'sch-1',
      subjectGroupId: 'sg-1',
      duration: 1,
      classroomId: 'c-1',
      dayOfWeek: 1,
      slotIndex: 0,
    });
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce(slot);
    dataProviderMock.getScheduleContext.mockResolvedValueOnce({
      academicYearId: 'ay-1',
      period: 1,
      shift: 'morning',
    });
    dataProviderMock.isGroupCommon.mockResolvedValueOnce(false);
    repositoryMock.findByScheduleId.mockResolvedValueOnce([slot]);
    validationProviderMock.validateMove.mockRejectedValueOnce(
      new ConflictError('ERR_UNASSIGNED_NO_COMPATIBLE_SLOTS')
    );

    const result = await useCase.execute('org-1', 'user-1', slot.id, {
      dayOfWeek: null,
      slotIndex: null,
    });

    expect(result.dayOfWeek).toBeNull();
    expect(result.slotIndex).toBeNull();
    expect(dataProviderMock.unpublishSchedule).toHaveBeenCalledWith(
      'sch-1',
      'org-1'
    );
    expect(slot.conflicts[0]?.type).toBe('UNASSIGNED_NO_COMPATIBLE_SLOTS');
  });

  test('should clear the conflict from the slot left alone in the old time range', async () => {
    const movedSlot = ScheduleSlot.create({
      scheduleId: 'sch-1',
      subjectGroupId: 'sg-1',
      duration: 1,
      classroomId: 'c-1',
      dayOfWeek: 1,
      slotIndex: 0,
      conflicts: [
        { type: 'COURSE_OVERLAP_THEORY', message: 'ERR_OVERLAP_THEORY' },
      ],
    });
    const remainingSlot = ScheduleSlot.create({
      scheduleId: 'sch-1',
      subjectGroupId: 'sg-2',
      duration: 1,
      classroomId: 'c-2',
      dayOfWeek: 1,
      slotIndex: 0,
      conflicts: [
        { type: 'COURSE_OVERLAP_THEORY', message: 'ERR_OVERLAP_THEORY' },
      ],
    });

    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce(movedSlot);
    dataProviderMock.getScheduleContext.mockResolvedValueOnce({
      academicYearId: 'ay-1',
      shift: 'morning',
    });
    dataProviderMock.isGroupCommon.mockResolvedValueOnce(false);
    validationProviderMock.validateMove.mockResolvedValue(undefined);
    repositoryMock.findByScheduleId.mockResolvedValueOnce([
      movedSlot,
      remainingSlot,
    ]);

    await useCase.execute('org-1', 'user-1', movedSlot.id, {
      classroomId: 'c-1',
      dayOfWeek: 1,
      slotIndex: 2,
    });

    expect(remainingSlot.conflicts).toEqual([]);
    expect(repositoryMock.updateConflicts).toHaveBeenCalledWith(remainingSlot);
    expect(
      dataProviderMock.updateScheduleConflictsAndUnassignedCount
    ).toHaveBeenCalledWith('sch-1', 'org-1');
  });

  test('should keep conflicts between slots that still overlap after moving a third slot', async () => {
    const movedSlot = ScheduleSlot.create({
      scheduleId: 'sch-1',
      subjectGroupId: 'sg-1',
      duration: 1,
      classroomId: 'c-1',
      dayOfWeek: 1,
      slotIndex: 0,
      conflicts: [
        { type: 'COURSE_OVERLAP_THEORY', message: 'ERR_OVERLAP_THEORY' },
      ],
    });
    const remainingSlotA = ScheduleSlot.create({
      scheduleId: 'sch-1',
      subjectGroupId: 'sg-2',
      duration: 1,
      classroomId: 'c-2',
      dayOfWeek: 1,
      slotIndex: 0,
      conflicts: [
        { type: 'COURSE_OVERLAP_THEORY', message: 'ERR_OVERLAP_THEORY' },
      ],
    });
    const remainingSlotB = ScheduleSlot.create({
      scheduleId: 'sch-1',
      subjectGroupId: 'sg-3',
      duration: 1,
      classroomId: 'c-3',
      dayOfWeek: 1,
      slotIndex: 0,
      conflicts: [
        { type: 'COURSE_OVERLAP_THEORY', message: 'ERR_OVERLAP_THEORY' },
      ],
    });

    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce(movedSlot);
    dataProviderMock.getScheduleContext.mockResolvedValueOnce({
      academicYearId: 'ay-1',
      shift: 'morning',
    });
    dataProviderMock.isGroupCommon.mockResolvedValueOnce(false);
    validationProviderMock.validateMove
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new ConflictError('ERR_OVERLAP_THEORY'))
      .mockRejectedValueOnce(new ConflictError('ERR_OVERLAP_THEORY'));
    repositoryMock.findByScheduleId.mockResolvedValueOnce([
      movedSlot,
      remainingSlotA,
      remainingSlotB,
    ]);

    await useCase.execute('org-1', 'user-1', movedSlot.id, {
      classroomId: 'c-1',
      dayOfWeek: 1,
      slotIndex: 2,
    });

    expect(remainingSlotA.conflicts).toEqual([
      { type: 'COURSE_OVERLAP_THEORY', message: 'ERR_OVERLAP_THEORY' },
    ]);
    expect(remainingSlotB.conflicts).toEqual([
      { type: 'COURSE_OVERLAP_THEORY', message: 'ERR_OVERLAP_THEORY' },
    ]);
    expect(repositoryMock.updateConflicts).toHaveBeenCalledTimes(2);
    expect(
      dataProviderMock.updateScheduleConflictsAndUnassignedCount
    ).toHaveBeenCalledWith('sch-1', 'org-1');
  });
});
