import { describe, expect, test, mock } from 'bun:test';
import { CreateDegreeUseCase } from './create-degree.usecase';
import { ForbiddenError } from '@/core/errors/app.error';

describe('CreateDegreeUseCase', () => {
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

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const useCase = new CreateDegreeUseCase(repositoryMock, memberProviderMock);

  test('should create a degree successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const dto = { name: 'Computer Science', code: 'CS' };
    const result = await useCase.execute('org-1', 'user-1', dto);
    expect(result.name).toBe('Computer Science');
    expect(repositoryMock.create).toHaveBeenCalled();
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    const dto = { name: 'Computer Science', code: 'CS' };
    expect(useCase.execute('org-1', 'user-1', dto)).rejects.toThrow(
      ForbiddenError
    );
  });
});
