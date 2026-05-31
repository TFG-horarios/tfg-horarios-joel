import { describe, expect, test, mock } from 'bun:test';
import { GetDegreeUseCase } from './get-degree.usecase';
import { Degree } from '../domain/degree.entity';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

describe('GetDegreeUseCase', () => {
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

  const useCase = new GetDegreeUseCase(repositoryMock, memberProviderMock);

  test('should retrieve degree successfully', async () => {
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
    repositoryMock.findById.mockResolvedValueOnce(degree);
    const result = await useCase.execute('org-1', 'deg-1', 'user-1');
    expect(result.id).toBe('deg-1');
  });

  test('should throw NotFoundError if degree does not exist', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    repositoryMock.findById.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'deg-1', 'user-1')).rejects.toThrow(
      NotFoundError
    );
  });

  test('should throw ForbiddenError if user has no role', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'deg-1', 'user-1')).rejects.toThrow(
      ForbiddenError
    );
  });
});
