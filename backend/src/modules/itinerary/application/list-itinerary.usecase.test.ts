import { describe, expect, test, mock } from 'bun:test';
import { ListItinerariesUseCase } from './list-itinerary.usecase';
import { Itinerary } from '../domain/itinerary.entity';
import { ForbiddenError } from '@/core/errors/app.error';

describe('ListItinerariesUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findAll: mock(),
    create: mock(),
    createMany: mock(),
    update: mock(),
    delete: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const useCase = new ListItinerariesUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should list itineraries successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    const itinerary = Itinerary.reconstitute({
      id: 'iti-1',
      organizationId: 'org-1',
      degreeId: 'deg-1',
      name: 'Software Eng',
      code: 'SE',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    repositoryMock.findAll.mockResolvedValueOnce([itinerary]);
    const result = await useCase.execute('org-1', 'user-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('iti-1');
  });

  test('should throw ForbiddenError if user has no role', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'user-1')).rejects.toThrow(ForbiddenError);
  });
});
