import { describe, expect, test, mock } from 'bun:test';
import { UpdateClassroomUseCase } from './update-classroom.usecase';
import { Classroom } from '../domain/classroom.entity';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

describe('UpdateClassroomUseCase', () => {
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

  const useCase = new UpdateClassroomUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should update classroom successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const classroom = Classroom.reconstitute({
      id: 'classroom-1',
      organizationId: 'org-1',
      name: 'Old Lab',
      capacity: 30,
      type: 'lab',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    repositoryMock.findById.mockResolvedValueOnce(classroom);
    const dto = { name: 'New Lab', capacity: 40, type: 'theory' as const };
    const result = await useCase.execute('org-1', 'classroom-1', 'user-1', dto);
    expect(result.name).toBe('New Lab');
    expect(result.capacity).toBe(40);
    expect(result.type).toBe('theory');
    expect(repositoryMock.update).toHaveBeenCalledWith(classroom);
  });

  test('should throw NotFoundError if classroom does not exist', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce(null);
    const dto = { name: 'New Lab', capacity: 40, type: 'theory' as const };
    expect(
      useCase.execute('org-1', 'classroom-1', 'user-1', dto)
    ).rejects.toThrow(NotFoundError);
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    const dto = { name: 'New Lab', capacity: 40, type: 'theory' as const };
    expect(
      useCase.execute('org-1', 'classroom-1', 'user-1', dto)
    ).rejects.toThrow(ForbiddenError);
  });
});
