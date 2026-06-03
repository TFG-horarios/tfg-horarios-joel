import { describe, expect, test, mock } from 'bun:test';
import { GetClassroomUseCase } from './get-classroom.usecase';
import { Classroom } from '../domain/classroom.entity';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

describe('GetClassroomUseCase', () => {
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

  const useCase = new GetClassroomUseCase(repositoryMock, memberProviderMock);

  test('should retrieve classroom successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    const classroom = Classroom.reconstitute({
      id: 'classroom-1',
      organizationId: 'org-1',
      name: 'Lab 1',
      capacity: 30,
      type: 'lab',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    repositoryMock.findById.mockResolvedValueOnce(classroom);
    const result = await useCase.execute('org-1', 'classroom-1', 'user-1');
    expect(result.id).toBe('classroom-1');
    expect(result.name).toBe('Lab 1');
  });

  test('should throw NotFoundError if classroom does not exist', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    repositoryMock.findById.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'classroom-1', 'user-1')).rejects.toThrow(
      NotFoundError
    );
  });

  test('should throw ForbiddenError if user has no role', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'classroom-1', 'user-1')).rejects.toThrow(
      ForbiddenError
    );
  });
});
