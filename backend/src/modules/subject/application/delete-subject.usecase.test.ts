import { describe, expect, test, mock } from 'bun:test';
import { DeleteSubjectUseCase } from './delete-subject.usecase';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

describe('DeleteSubjectUseCase', () => {
  const repositoryMock = {
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
  const memberProviderMock = { getMemberRole: mock() };
  const useCase = new DeleteSubjectUseCase(repositoryMock, memberProviderMock);

  test('should delete subject successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce({
      id: 'sub-1',
    });
    await useCase.execute('org-1', 'sub-1', 'user-1');
    expect(repositoryMock.delete).toHaveBeenCalledWith('sub-1', 'org-1');
  });

  test('should throw ForbiddenError if lacking permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    expect(useCase.execute('org-1', 'sub-1', 'user-1')).rejects.toThrow(
      ForbiddenError
    );
  });

  test('should throw NotFoundError if not found', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'sub-1', 'user-1')).rejects.toThrow(
      NotFoundError
    );
  });
});
