import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { ListAllDegreesUseCase } from './list-all-degrees.usecase';
import { Degree } from '../domain/degree.entity';
import { ForbiddenError } from '@/core/errors/app.error';

describe('ListAllDegreesUseCase', () => {
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

  const useCase = new ListAllDegreesUseCase(repositoryMock, memberProviderMock);

  beforeEach(() => {
    repositoryMock.findAll.mockClear();
    memberProviderMock.getMemberRole.mockClear();
  });

  test('should list all degrees successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('ADMIN');
    const degree = Degree.reconstitute({
      organizationId: 'org-id',
      name: 'Computer Science',
      code: 'CS',
      id: 'degree-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    repositoryMock.findAll.mockResolvedValue([degree]);
    const result = await useCase.execute('org-id', 'user-id');
    expect(memberProviderMock.getMemberRole).toHaveBeenCalledWith(
      'user-id',
      'org-id'
    );
    expect(repositoryMock.findAll).toHaveBeenCalledWith('org-id');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('degree-id');
    expect(result[0]?.name).toBe('Computer Science');
    expect(result[0]?.code).toBe('CS');
  });

  test('should throw ForbiddenError if user is not a member', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue(null);
    await expect(useCase.execute('org-id', 'user-id')).rejects.toThrow(
      ForbiddenError
    );
    expect(repositoryMock.findAll).not.toHaveBeenCalled();
  });
});
