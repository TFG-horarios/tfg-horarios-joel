import { describe, expect, test, mock } from 'bun:test';
import { ListScheduleTimeConfigsUseCase } from './list-schedule-time-configs.usecase';
import { ForbiddenError } from '@/core/errors/app.error';
import { ScheduleTimeConfig } from '../domain/schedule-time-config.entity';

describe('ListScheduleTimeConfigsUseCase', () => {
  const repositoryMock = {
    save: mock(),
    update: mock(),
    validateScope: mock(),
    findAll: mock(),
    findById: mock(),
    delete: mock(),
    deleteAll: mock(),
    findPossibilities: mock(),
    isReferenced: mock(),
    findEffective: mock(),
  };
  const memberProviderMock = { getMemberRole: mock() };
  const useCase = new ListScheduleTimeConfigsUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should return list of schedule time configs successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');

    const config = ScheduleTimeConfig.create({
      organizationId: 'org-1',
      academicYearId: 'ay-1',
      degreeId: 'deg-1',
      itineraryId: null,
      courseYear: 1,
      period: 1,
      shift: 'morning',
      startTime: '08:00',
      endTime: '14:00',
      hasBreak: true,
      breakAfterSlot: 3,
    });

    repositoryMock.findAll.mockResolvedValueOnce([config]);

    const filters = { degreeId: 'deg-1' };
    const result = await useCase.execute('org-1', 'ay-1', 'user-1', filters);

    expect(result.length).toBe(1);
    expect(result[0]?.id).toBe(config.id);
    expect(result[0]?.degreeId).toBe('deg-1');
    expect(repositoryMock.findAll).toHaveBeenCalledWith(
      'org-1',
      'ay-1',
      filters
    );
  });

  test('should throw ForbiddenError if user lacks access', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'ay-1', 'user-1', {})).rejects.toThrow(
      ForbiddenError
    );
  });
});
