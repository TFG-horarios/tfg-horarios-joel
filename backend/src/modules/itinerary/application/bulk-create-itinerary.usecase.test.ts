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
      { name: 'Software Eng', code: 'SE' },
      { name: 'Computer Sci', code: 'CS' },
    ];
    const result = await useCase.execute('org-1', 'deg-1', 'user-1', dtos);
    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe('Software Eng');
    expect(repositoryMock.createMany).toHaveBeenCalled();
  });

  test('should throw ValidationError if no data provided', async () => {
    expect(useCase.execute('org-1', 'deg-1', 'user-1', [])).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ValidationError if duplicate codes in request', async () => {
    const dtos = [
      { name: 'SE', code: 'SE' },
      { name: 'CS', code: 'SE' },
    ];
    expect(useCase.execute('org-1', 'deg-1', 'user-1', dtos)).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    const dtos = [{ name: 'SE', code: 'SE' }];
    expect(useCase.execute('org-1', 'deg-1', 'user-1', dtos)).rejects.toThrow(
      ForbiddenError
    );
  });
});
