import { describe, expect, test, mock } from 'bun:test';
import { ListDegreesUseCase } from './list-degree.usecase';
import { Degree } from '../domain/degree.entity';
import { ForbiddenError } from '@/core/errors/app.error';

describe('ListDegreesUseCase', () => {
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

  const useCase = new ListDegreesUseCase(repositoryMock, memberProviderMock);

  test('should list degrees successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    const degree = Degree.reconstitute({
      id: 'deg-1',
      organizationId: 'org-1',
      name: 'Computer Science',
      code: 'CS',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    repositoryMock.findAll.mockResolvedValueOnce([degree]);
    const result = await useCase.execute('org-1', 'user-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('deg-1');
  });

  test('should throw ForbiddenError if user has no role', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'user-1')).rejects.toThrow(ForbiddenError);
  });
});
