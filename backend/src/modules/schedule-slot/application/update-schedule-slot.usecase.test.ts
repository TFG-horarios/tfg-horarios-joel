import { describe, expect, test, mock } from 'bun:test';
import { UpdateScheduleSlotUseCase } from './update-schedule-slot.usecase';
import { ScheduleSlot } from '../domain/schedule-slot.entity';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

describe('UpdateScheduleSlotUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findByScheduleId: mock(),
    create: mock(),
    createMany: mock(),
    update: mock(),
    delete: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const useCase = new UpdateScheduleSlotUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should update schedule slot successfully', async () => {
    const slot = ScheduleSlot.create({
      scheduleId: 'sch-1',
      subjectGroupId: 'sg-1',
      duration: 2,
    });
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce(slot);
    const dto = { classroomId: 'c-2', dayOfWeek: 2, slotIndex: 1 };
    const result = await useCase.execute('org-1', 'user-1', slot.id, dto);
    expect(result.classroomId).toBe('c-2');
    expect(result.dayOfWeek).toBe(2);
    expect(result.slotIndex).toBe(1);
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
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce(slot);
    const dto = { classroomId: 'c-2' };
    const result = await useCase.execute('org-1', 'user-1', slot.id, dto);
    expect(result.classroomId).toBe('c-2');
    expect(result.dayOfWeek).toBe(1);
    expect(result.slotIndex).toBe(0);
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
});
