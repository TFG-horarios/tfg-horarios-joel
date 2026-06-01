import { describe, expect, test, mock } from 'bun:test';
import { DeleteSubjectGroupUseCase } from './delete-subject-group.usecase';

describe('DeleteSubjectGroupUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findAll: mock(),
    findGroupsWithSubjectsInScope: mock(),
    create: mock(),
    createMany: mock(),
    update: mock(),
    delete: mock(),
    deleteAll: mock(),
    replace: mock(),
  };

  const memberProviderMock = { getMemberRole: mock() };

  const useCase = new DeleteSubjectGroupUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should delete successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce({ id: 'grp-1' });
    await useCase.execute('org-1', 'grp-1', 'user-1');
    expect(repositoryMock.delete).toHaveBeenCalledWith('grp-1', 'org-1');
  });
});
