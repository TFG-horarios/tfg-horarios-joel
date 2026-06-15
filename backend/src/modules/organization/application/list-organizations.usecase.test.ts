import { describe, expect, test, mock } from 'bun:test';
import { ListOrganizationsUseCase } from './list-organizations.usecase';
import { Organization } from '../domain/organization.entity';

describe('ListOrganizationsUseCase', () => {
  const repositoryMock = {
    findByUserId: mock(),
    findById: mock(),
    create: mock(),
    delete: mock(),
    update: mock(),
  };

  const useCase = new ListOrganizationsUseCase(repositoryMock);

  test('should list organizations successfully', async () => {
    const org = Organization.reconstitute({
      id: 'org-1',
      name: 'Test Org',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repositoryMock.findByUserId.mockResolvedValueOnce([org]);
    const result = await useCase.execute('user-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('org-1');
  });
});
