import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { ListAllItinerariesUseCase } from './list-all-itineraries.usecase';
import { Itinerary } from '../domain/itinerary.entity';
import { ForbiddenError } from '@/core/errors/app.error';

describe('ListAllItinerariesUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findAll: mock(),
    findPaginated: mock(),
    findIdentifiers: mock(),
    create: mock(),
    createMany: mock(),
    update: mock(),
    delete: mock(),
    deleteAll: mock(),
    replace: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const academicYearProviderMock = {
    shouldIncludeSoftDeleted: mock(),
  };

  const useCase = new ListAllItinerariesUseCase(
    repositoryMock,
    memberProviderMock,
    academicYearProviderMock
  );

  beforeEach(() => {
    repositoryMock.findAll.mockClear();
    memberProviderMock.getMemberRole.mockClear();
    academicYearProviderMock.shouldIncludeSoftDeleted.mockClear();
  });

  test('should list all itineraries successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('ADMIN');

    const itinerary = Itinerary.reconstitute({
      organizationId: 'org-1',
      degreeId: 'deg-1',
      name: 'Software Engineering',
      code: 'SE',
      id: 'it-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    repositoryMock.findAll.mockResolvedValue([itinerary]);

    const result = await useCase.execute('org-1', 'user-1');

    expect(memberProviderMock.getMemberRole).toHaveBeenCalledWith(
      'user-1',
      'org-1'
    );
    expect(repositoryMock.findAll).toHaveBeenCalledWith('org-1', false);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('it-1');
  });

  test('should throw ForbiddenError if user is not a member', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue(null);

    await expect(useCase.execute('org-1', 'user-1')).rejects.toThrow(
      ForbiddenError
    );

    expect(repositoryMock.findAll).not.toHaveBeenCalled();
  });
});
