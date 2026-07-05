import { describe, expect, test, mock } from 'bun:test';
import { GetScheduleTimeConfigPossibilitiesUseCase } from './get-schedule-time-config-possibilities.usecase';
import { ForbiddenError } from '@/core/errors/app.error';

describe('GetScheduleTimeConfigPossibilitiesUseCase', () => {
  const repositoryMock = {
    save: mock(),
    update: mock(),
    validateScope: mock(),
    findAll: mock(),
    findById: mock(),
    findPossibilities: mock(),
    delete: mock(),
    deleteAll: mock(),
    isReferenced: mock(),
    findEffective: mock(),
  };
  const memberProviderMock = { getMemberRole: mock() };
  const useCase = new GetScheduleTimeConfigPossibilitiesUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should return list of possibilities successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');

    const possibilities = [
      {
        degreeId: 'deg-1',
        degreeName: 'Computer Science',
        itineraryId: null,
        itineraryName: null,
        courseYear: 1,
        period: 1,
        shift: 'morning' as const,
      },
    ];

    repositoryMock.findPossibilities.mockResolvedValueOnce(possibilities);

    const result = await useCase.execute('org-1', 'ay-1', 'user-1');

    expect(result.length).toBe(1);
    expect(result[0]?.degreeId).toBe('deg-1');
    expect(repositoryMock.findPossibilities).toHaveBeenCalledWith('org-1');
  });

  test('should throw ForbiddenError if user lacks access', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'ay-1', 'user-1')).rejects.toThrow(
      ForbiddenError
    );
  });
});
