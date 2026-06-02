import { describe, expect, test, mock } from 'bun:test';
import { ReplaceItinerariesUseCase } from './replace-itineraries.usecase';
import { ForbiddenError, ValidationError } from '@/core/errors/app.error';

describe('ReplaceItinerariesUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findAll: mock(),
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

  const useCase = new ReplaceItinerariesUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should replace itineraries successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const dtos = [
      { name: 'Itinerary A', code: 'IA', degreeId: 'deg-1' },
      { name: 'Itinerary B', code: 'IB', degreeId: 'deg-1' },
    ];
    const result = await useCase.execute('org-1', 'user-1', dtos);
    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe('Itinerary A');
    expect(result[1]?.name).toBe('Itinerary B');
    expect(repositoryMock.replace).toHaveBeenCalled();
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    expect(
      useCase.execute('org-1', 'user-1', [
        { name: 'A', code: 'A', degreeId: 'deg-1' },
      ])
    ).rejects.toThrow(ForbiddenError);
  });

  test('should throw ValidationError if request contains duplicate codes', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const dtos = [
      { name: 'Itinerary A', code: 'IA', degreeId: 'deg-1' },
      { name: 'Itinerary B', code: 'IA', degreeId: 'deg-1' },
    ];
    expect(useCase.execute('org-1', 'user-1', dtos)).rejects.toThrow(
      ValidationError
    );
  });
});
