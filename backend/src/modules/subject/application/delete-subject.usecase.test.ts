import { describe, expect, test, mock } from 'bun:test';
import { DeleteSubjectUseCase } from './delete-subject.usecase';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

describe('DeleteSubjectUseCase', () => {
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
  const useCase = new DeleteSubjectUseCase(repositoryMock, memberProviderMock);

  test('should delete subject successfully', async () => {
    (
      memberProviderMock.getMemberRole as ReturnType<typeof mock>
    ).mockResolvedValueOnce('admin');
    (repositoryMock.findById as ReturnType<typeof mock>).mockResolvedValueOnce({
      id: 'sub-1',
    });
    await useCase.execute('org-1', 'sub-1', 'user-1');
    expect(repositoryMock.delete).toHaveBeenCalledWith('sub-1', 'org-1');
  });

  test('should throw ForbiddenError if lacking permission', async () => {
    (
      memberProviderMock.getMemberRole as ReturnType<typeof mock>
    ).mockResolvedValueOnce('viewer');
    expect(useCase.execute('org-1', 'sub-1', 'user-1')).rejects.toThrow(
      ForbiddenError
    );
  });

  test('should throw NotFoundError if not found', async () => {
    (
      memberProviderMock.getMemberRole as ReturnType<typeof mock>
    ).mockResolvedValueOnce('admin');
    (repositoryMock.findById as ReturnType<typeof mock>).mockResolvedValueOnce(
      null
    );
    expect(useCase.execute('org-1', 'sub-1', 'user-1')).rejects.toThrow(
      NotFoundError
    );
  });
});
