import { describe, expect, test, mock } from 'bun:test';
import { ListAllClassroomsUseCase } from './list-all-classrooms.usecase';
import { Classroom } from '../domain/classroom.entity';
import { ForbiddenError } from '@/core/errors/app.error';

describe('ListAllClassroomsUseCase', () => {
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

  const useCase = new ListAllClassroomsUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should list all classrooms successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    const classroom = Classroom.reconstitute({
      id: 'classroom-1',
      organizationId: 'org-1',
      name: 'Lab 1',
      capacity: 30,
      floor: 1,
      type: 'lab',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    repositoryMock.findAll.mockResolvedValueOnce([classroom]);
    const result = await useCase.execute('org-1', 'user-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('classroom-1');
  });

  test('should throw ForbiddenError if user has no role', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'user-1')).rejects.toThrow(ForbiddenError);
  });
});
