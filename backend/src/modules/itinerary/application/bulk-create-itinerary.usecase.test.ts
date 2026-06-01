import { describe, expect, test, mock } from 'bun:test';
import { BulkCreateItinerariesUseCase } from './bulk-create-itinerary.usecase';
import { ForbiddenError, ValidationError } from '@/core/errors/app.error';

describe('BulkCreateItinerariesUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findAll: mock(),
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

  const useCase = new BulkCreateItinerariesUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should create multiple itineraries successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const dtos = [
      { name: 'Software Eng', code: 'SE', degreeId: 'deg-1' },
      { name: 'Computer Sci', code: 'CS', degreeId: 'deg-1' },
    ];
    const result = await useCase.execute('org-1', 'user-1', dtos);
    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe('Software Eng');
    expect(repositoryMock.createMany).toHaveBeenCalled();
  });

  test('should throw ValidationError if no data provided', async () => {
    expect(useCase.execute('org-1', 'user-1', [])).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ValidationError if duplicate codes in request', async () => {
    const dtos = [
      { name: 'SE', code: 'SE', degreeId: 'deg-1' },
      { name: 'CS', code: 'SE', degreeId: 'deg-1' },
    ];
    expect(useCase.execute('org-1', 'user-1', dtos)).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    const dtos = [{ name: 'SE', code: 'SE', degreeId: 'deg-1' }];
    expect(useCase.execute('org-1', 'user-1', dtos)).rejects.toThrow(
      ForbiddenError
    );
  });
});
