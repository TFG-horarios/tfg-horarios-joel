import { describe, expect, test, mock } from 'bun:test';
import { GetItineraryUseCase } from './get-itinerary.usecase';
import { Itinerary } from '../domain/itinerary.entity';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

describe('GetItineraryUseCase', () => {
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

  const useCase = new GetItineraryUseCase(repositoryMock, memberProviderMock);

  test('should retrieve itinerary successfully', async () => {
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
    repositoryMock.findById.mockResolvedValueOnce(itinerary);
    const result = await useCase.execute('org-1', 'iti-1', 'user-1');
    expect(result.id).toBe('iti-1');
  });

  test('should throw NotFoundError if itinerary does not exist', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    repositoryMock.findById.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'iti-1', 'user-1')).rejects.toThrow(
      NotFoundError
    );
  });

  test('should throw ForbiddenError if user has no role', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'iti-1', 'user-1')).rejects.toThrow(
      ForbiddenError
    );
  });
});
