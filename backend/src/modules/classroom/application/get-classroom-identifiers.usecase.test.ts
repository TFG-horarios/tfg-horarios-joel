import { describe, expect, test, mock } from 'bun:test';
import { GetClassroomIdentifiersUseCase } from './get-classroom-identifiers.usecase';
import { ForbiddenError } from '@/core/errors/app.error';

describe('GetClassroomIdentifiersUseCase', () => {
  const mockClassroomRepository = {
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

  const useCase = new GetClassroomIdentifiersUseCase(
    mockClassroomRepository,
    mockMemberProvider
  );

  const organizationId = 'org-123';
  const userId = 'user-123';

  test('should return array of strings successfully', async () => {
    mockMemberProvider.getMemberRole.mockResolvedValueOnce('admin');
    mockClassroomRepository.findIdentifiers.mockResolvedValueOnce([
      'Aula 1',
      'Lab A',
    ]);
    const result = await useCase.execute(organizationId, userId);
    expect(result).toEqual(['Aula 1', 'Lab A']);
    expect(mockMemberProvider.getMemberRole).toHaveBeenCalledWith(
      userId,
      organizationId
    );
    expect(mockClassroomRepository.findIdentifiers).toHaveBeenCalledWith(
      organizationId
    );
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    mockMemberProvider.getMemberRole.mockResolvedValueOnce(null);
    mockClassroomRepository.findIdentifiers.mockClear();
    await expect(useCase.execute(organizationId, userId)).rejects.toThrow(
      ForbiddenError
    );
    expect(mockClassroomRepository.findIdentifiers).not.toHaveBeenCalled();
  });
});
