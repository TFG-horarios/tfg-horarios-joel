import { describe, expect, test, mock } from 'bun:test';
import { GetItineraryIdentifiersUseCase } from './get-itinerary-identifiers.usecase';
import { ForbiddenError } from '@/core/errors/app.error';

describe('GetItineraryIdentifiersUseCase', () => {
  const mockItineraryRepository = {
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

  const mockMemberProvider = {
    getMemberRole: mock(),
  };

  const useCase = new GetItineraryIdentifiersUseCase(
    mockItineraryRepository,
    mockMemberProvider
  );

  const organizationId = 'org-123';
  const userId = 'user-123';

  test('should return array of strings successfully', async () => {
    mockMemberProvider.getMemberRole.mockResolvedValueOnce('admin');
    mockItineraryRepository.findIdentifiers.mockResolvedValueOnce([
      'ID1',
      'ID2',
    ]);
    const result = await useCase.execute(organizationId, userId);
    expect(result).toEqual(['ID1', 'ID2']);
    expect(mockMemberProvider.getMemberRole).toHaveBeenCalledWith(
      userId,
      organizationId
    );
    expect(mockItineraryRepository.findIdentifiers).toHaveBeenCalledWith(
      organizationId
    );
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    mockMemberProvider.getMemberRole.mockResolvedValueOnce(null);
    mockItineraryRepository.findIdentifiers.mockClear();
    await expect(useCase.execute(organizationId, userId)).rejects.toThrow(
      ForbiddenError
    );
    expect(mockItineraryRepository.findIdentifiers).not.toHaveBeenCalled();
  });
});
