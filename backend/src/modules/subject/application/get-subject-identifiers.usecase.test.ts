import { describe, expect, test, mock } from 'bun:test';
import { GetSubjectIdentifiersUseCase } from './get-subject-identifiers.usecase';
import { ForbiddenError } from '@/core/errors/app.error';

describe('GetSubjectIdentifiersUseCase', () => {
  const mockSubjectRepository = {
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

  const useCase = new GetSubjectIdentifiersUseCase(
    mockSubjectRepository,
    mockMemberProvider
  );

  const organizationId = 'org-123';
  const userId = 'user-123';

  test('should return array of strings successfully', async () => {
    mockMemberProvider.getMemberRole.mockResolvedValueOnce('admin');
    mockSubjectRepository.findIdentifiers.mockResolvedValueOnce(['ID1', 'ID2']);
    const result = await useCase.execute(organizationId, userId);
    expect(result).toEqual(['ID1', 'ID2']);
    expect(mockMemberProvider.getMemberRole).toHaveBeenCalledWith(
      userId,
      organizationId
    );
    expect(mockSubjectRepository.findIdentifiers).toHaveBeenCalledWith(
      organizationId
    );
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    mockMemberProvider.getMemberRole.mockResolvedValueOnce(null);
    mockSubjectRepository.findIdentifiers.mockClear();
    await expect(useCase.execute(organizationId, userId)).rejects.toThrow(
      ForbiddenError
    );
    expect(mockSubjectRepository.findIdentifiers).not.toHaveBeenCalled();
  });
});
