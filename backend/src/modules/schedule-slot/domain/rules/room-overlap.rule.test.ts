import { describe, expect, test, mock } from 'bun:test';
import { RoomOverlapRule } from './room-overlap.rule';
import type { MoveValidationContext } from './move-validation';
import { ConflictError } from '@/core/errors/app.error';

describe('RoomOverlapRule', () => {
  const repositoryMock = {
    findActiveClassroomConfigurationsPaginated: mock(),
    findSlotsByClassroomIdAndFilters: mock(),
    findById: mock(),
    findByScheduleId: mock(),
    findLinkedSlots: mock(),
    create: mock(),
    createMany: mock(),
    update: mock(),
    delete: mock(),
  };
  const rule = new RoomOverlapRule(repositoryMock);

  test('does not throw if no overlap', async () => {
    repositoryMock.findSlotsByClassroomIdAndFilters.mockResolvedValue([
      { id: '2', dayOfWeek: 1, slotIndex: 3, duration: 1 },
    ]);

    const ctx = {
      newClassroomId: 'c-1',
      newDayOfWeek: 1,
      newSlotIndex: 1,
      movingAssignment: { id: '1', duration: 1 },
      organizationId: 'o-1',
      academicYearId: 'ay-1',
      period: 1,
      shift: 'morning',
    } as unknown as MoveValidationContext;

    await expect(rule.validate(ctx)).resolves.toBeUndefined();
  });

  test('throws ERR_ROOM_OVERLAP if overlapping', async () => {
    repositoryMock.findSlotsByClassroomIdAndFilters.mockResolvedValue([
      { id: '2', dayOfWeek: 1, slotIndex: 1, duration: 2 },
    ]);

    const ctx = {
      newClassroomId: 'c-1',
      newDayOfWeek: 1,
      newSlotIndex: 2,
      movingAssignment: { id: '1', duration: 1 },
      organizationId: 'o-1',
      academicYearId: 'ay-1',
      period: 1,
      shift: 'morning',
    } as unknown as MoveValidationContext;

    await expect(rule.validate(ctx)).rejects.toThrow(
      new ConflictError('ERR_ROOM_OVERLAP')
    );
  });
});
