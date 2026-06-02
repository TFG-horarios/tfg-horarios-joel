import { describe, expect, test, mock } from 'bun:test';
import { DeleteDegreeUseCase } from './delete-degree.usecase';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

describe('DeleteDegreeUseCase', () => {
  const repositoryMock = {
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

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const useCase = new DeleteDegreeUseCase(repositoryMock, memberProviderMock);

  test('should delete degree successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce({ id: 'deg-1' });
    await useCase.execute('org-1', 'deg-1', 'user-1');
    expect(repositoryMock.delete).toHaveBeenCalledWith('deg-1', 'org-1');
  });

  test('should throw NotFoundError if degree does not exist', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'deg-1', 'user-1')).rejects.toThrow(
      NotFoundError
    );
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    expect(useCase.execute('org-1', 'deg-1', 'user-1')).rejects.toThrow(
      ForbiddenError
    );
  });
});
