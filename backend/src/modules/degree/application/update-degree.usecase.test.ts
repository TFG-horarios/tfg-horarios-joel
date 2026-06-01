import { describe, expect, test, mock } from 'bun:test';
import { UpdateDegreeUseCase } from './update-degree.usecase';
import { Degree } from '../domain/degree.entity';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

describe('UpdateDegreeUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findAll: mock(),
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

  const useCase = new UpdateDegreeUseCase(repositoryMock, memberProviderMock);

  test('should update degree successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const degree = Degree.reconstitute({
      id: 'deg-1',
      organizationId: 'org-1',
      name: 'Old Name',
      code: 'ON',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    repositoryMock.findById.mockResolvedValueOnce(degree);
    const dto = { name: 'New Name', code: 'NN' };
    const result = await useCase.execute('org-1', 'deg-1', 'user-1', dto);
    expect(result.name).toBe('New Name');
    expect(result.code).toBe('NN');
    expect(repositoryMock.update).toHaveBeenCalledWith(degree);
  });

  test('should throw NotFoundError if degree does not exist', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce(null);
    const dto = { name: 'New Name', code: 'NN' };
    expect(useCase.execute('org-1', 'deg-1', 'user-1', dto)).rejects.toThrow(
      NotFoundError
    );
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    const dto = { name: 'New Name', code: 'NN' };
    expect(useCase.execute('org-1', 'deg-1', 'user-1', dto)).rejects.toThrow(
      ForbiddenError
    );
  });
});
