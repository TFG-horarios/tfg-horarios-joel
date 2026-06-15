import { describe, expect, test, mock } from 'bun:test';
import { UpdateOrganizationUseCase } from './update-organization.usecase';
import { Organization } from '../domain/organization.entity';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

describe('UpdateOrganizationUseCase', () => {
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

  const useCase = new UpdateOrganizationUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should update organization successfully', async () => {
    const org = Organization.reconstitute({
      id: 'org-1',
      name: 'Old Org',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repositoryMock.findById.mockResolvedValueOnce(org);
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const dto = {
      name: 'New Org',
    };
    const result = await useCase.execute('org-1', 'user-1', dto);
    expect(result.name).toBe('New Org');
    expect(repositoryMock.update).toHaveBeenCalledWith(org);
  });

  test('should throw NotFoundError if organization does not exist', async () => {
    repositoryMock.findById.mockResolvedValueOnce(null);
    const dto = {
      name: 'New Org',
    };
    expect(useCase.execute('org-1', 'user-1', dto)).rejects.toThrow(
      NotFoundError
    );
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    repositoryMock.findById.mockResolvedValueOnce({ id: 'org-1' });
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    const dto = {
      name: 'New Org',
    };
    expect(useCase.execute('org-1', 'user-1', dto)).rejects.toThrow(
      ForbiddenError
    );
  });
});
