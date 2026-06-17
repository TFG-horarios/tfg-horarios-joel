import type { Shift } from '@tfg-horarios/shared';
import { describe, expect, test, mock } from 'bun:test';
import { GetSubjectGroupIdentifiersUseCase } from './get-subject-group-identifiers.usecase';
import { ForbiddenError } from '@/core/errors/app.error';

describe('GetSubjectGroupIdentifiersUseCase', () => {
  const mockSubjectGroupRepository = {
    findById: mock(),
    findAll: mock(),
    findPaginated: mock(),
    findGroupsWithSubjectsInScope: mock(),
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

  const useCase = new GetSubjectGroupIdentifiersUseCase(
    mockSubjectGroupRepository,
    mockMemberProvider
  );

  const organizationId = 'org-123';
  const userId = 'user-123';

  test('should return array of identifiers successfully', async () => {
    mockMemberProvider.getMemberRole.mockResolvedValueOnce('admin');
    const mockIdentifiers = [
      {
        subjectId: 'sub-1',
        shift: 'morning' as Shift,
        groupType: 'theory' as 'theory' | 'practices',
        weeklyHours: 2,
        groupNumber: 1,
      },
    ];
    mockSubjectGroupRepository.findIdentifiers.mockResolvedValueOnce(
      mockIdentifiers
    );
    const result = await useCase.execute(organizationId, userId);
    expect(result).toEqual(mockIdentifiers);
    expect(mockMemberProvider.getMemberRole).toHaveBeenCalledWith(
      userId,
      organizationId
    );
    expect(mockSubjectGroupRepository.findIdentifiers).toHaveBeenCalledWith(
      organizationId
    );
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    mockMemberProvider.getMemberRole.mockResolvedValueOnce(null);
    mockSubjectGroupRepository.findIdentifiers.mockClear();
    await expect(useCase.execute(organizationId, userId)).rejects.toThrow(
      ForbiddenError
    );
    expect(mockSubjectGroupRepository.findIdentifiers).not.toHaveBeenCalled();
  });
});
