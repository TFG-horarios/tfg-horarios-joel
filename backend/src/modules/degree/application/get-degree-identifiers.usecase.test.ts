import { describe, expect, test, mock } from 'bun:test';
import { GetDegreeIdentifiersUseCase } from './get-degree-identifiers.usecase';
import { ForbiddenError } from '@/core/errors/app.error';

describe('GetDegreeIdentifiersUseCase', () => {
  const mockDegreeRepository = {
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

  const mockMemberProvider = {
    getMemberRole: mock(),
  };

  const useCase = new GetDegreeIdentifiersUseCase(
    mockDegreeRepository,
    mockMemberProvider
  );

  const organizationId = 'org-123';
  const userId = 'user-123';

  test('should return array of objects successfully', async () => {
    mockMemberProvider.getMemberRole.mockResolvedValueOnce('admin');
    mockDegreeRepository.findIdentifiers.mockResolvedValueOnce([
      { name: 'Degree A', code: 'DA' },
      { name: 'Degree B', code: 'DB' },
    ]);
    const result = await useCase.execute(organizationId, userId);
    expect(result).toEqual([
      { name: 'Degree A', code: 'DA' },
      { name: 'Degree B', code: 'DB' },
    ]);
    expect(mockMemberProvider.getMemberRole).toHaveBeenCalledWith(
      userId,
      organizationId
    );
    expect(mockDegreeRepository.findIdentifiers).toHaveBeenCalledWith(
      organizationId
    );
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    mockMemberProvider.getMemberRole.mockResolvedValueOnce(null);
    mockDegreeRepository.findIdentifiers.mockClear();
    await expect(useCase.execute(organizationId, userId)).rejects.toThrow(
      ForbiddenError
    );
    expect(mockDegreeRepository.findIdentifiers).not.toHaveBeenCalled();
  });
});
