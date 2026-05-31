import { describe, expect, test, mock } from 'bun:test';
import { DeleteOrganizationUseCase } from './delete-organization.usecase';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

describe('DeleteOrganizationUseCase', () => {
  const repositoryMock = {
    findByUserId: mock(),
    findById: mock(),
    create: mock(),
    delete: mock(),
    update: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const useCase = new DeleteOrganizationUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should delete organization successfully', async () => {
    repositoryMock.findById.mockResolvedValueOnce({ id: 'org-1' });
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    await useCase.execute('org-1', 'user-1');
    expect(repositoryMock.delete).toHaveBeenCalledWith('org-1');
  });

  test('should throw NotFoundError if organization does not exist', async () => {
    repositoryMock.findById.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'user-1')).rejects.toThrow(NotFoundError);
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    repositoryMock.findById.mockResolvedValueOnce({ id: 'org-1' });
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    expect(useCase.execute('org-1', 'user-1')).rejects.toThrow(ForbiddenError);
  });
});
