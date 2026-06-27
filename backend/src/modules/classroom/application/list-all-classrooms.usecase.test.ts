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

  const academicYearProviderMock = {
    shouldIncludeSoftDeleted: mock(),
  };

  const useCase = new ListAllClassroomsUseCase(
    repositoryMock,
    memberProviderMock,
    academicYearProviderMock
  );

  test('should list all classrooms successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    academicYearProviderMock.shouldIncludeSoftDeleted.mockResolvedValueOnce(
      false
    );
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
    const result = await useCase.execute('org-1', 'user-1', 'year-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('classroom-1');
    expect(repositoryMock.findAll).toHaveBeenCalledWith('org-1', false);
  });

  test('should throw ForbiddenError if user has no role', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'user-1')).rejects.toThrow(ForbiddenError);
  });
});
