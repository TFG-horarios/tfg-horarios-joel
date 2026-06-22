import { describe, expect, test, mock } from 'bun:test';
import { ListScheduleSlotsUseCase } from './list-schedule-slots.usecase';
import { ScheduleSlot } from '../domain/schedule-slot.entity';
import { ForbiddenError } from '@/core/errors/app.error';

describe('ListScheduleSlotsUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findByScheduleId: mock(),
    findLinkedSlots: mock(),
    findScheduleIdsIncludingSlot: mock(),
    clearInclusionConflictsForSlot: mock(),
    updateConflicts: mock(),
    create: mock(),
    createMany: mock(),
    update: mock(),
    delete: mock(),
    findActiveClassroomConfigurationsPaginated: mock(),
    findSlotsByClassroomIdAndFilters: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const useCase = new ListScheduleSlotsUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should list schedule slots successfully', async () => {
    const slot = ScheduleSlot.create({
      scheduleId: 'sch-1',
      subjectGroupId: 'sg-1',
      duration: 2,
    });
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    repositoryMock.findByScheduleId.mockResolvedValueOnce([slot]);
    const result = await useCase.execute('org-1', 'user-1', 'sch-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(slot.id);
  });

  test('should throw ForbiddenError if user has no role', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'user-1', 'sch-1')).rejects.toThrow(
      ForbiddenError
    );
  });
});
