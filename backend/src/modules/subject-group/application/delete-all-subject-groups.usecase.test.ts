import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { DeleteAllSubjectGroupsUseCase } from './delete-all-subject-groups.usecase';
import { ForbiddenError } from '@/core/errors/app.error';

describe('DeleteAllSubjectGroupsUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findAll: mock(),
    findIdentifiers: mock(),
    findGroupsWithSubjectsInScope: mock(),
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

  const useCase = new DeleteAllSubjectGroupsUseCase(
    repositoryMock,
    memberProviderMock
  );

  beforeEach(() => {
    repositoryMock.deleteAll.mockClear();
    memberProviderMock.getMemberRole.mockClear();
  });

  test('should delete all subject groups successfully if user has permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    await useCase.execute('org-1', 'user-1');
    expect(memberProviderMock.getMemberRole).toHaveBeenCalledWith(
      'user-1',
      'org-1'
    );
    expect(repositoryMock.deleteAll).toHaveBeenCalledWith('org-1');
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('teacher');
    await expect(useCase.execute('org-1', 'user-1')).rejects.toThrow(
      ForbiddenError
    );
    expect(repositoryMock.deleteAll).not.toHaveBeenCalled();
  });

  test('should throw ForbiddenError if user is not a member', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce(null);
    await expect(useCase.execute('org-1', 'user-1')).rejects.toThrow(
      ForbiddenError
    );
    expect(repositoryMock.deleteAll).not.toHaveBeenCalled();
  });
});
