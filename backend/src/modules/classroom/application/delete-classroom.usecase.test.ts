import { describe, expect, test, mock } from 'bun:test';
import { DeleteClassroomUseCase } from './delete-classroom.usecase';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

describe('DeleteClassroomUseCase', () => {
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

  const useCase = new DeleteClassroomUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should delete classroom successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce({
      id: 'classroom-1',
    });

    await useCase.execute('org-1', 'classroom-1', 'user-1');

    expect(repositoryMock.delete).toHaveBeenCalledWith('classroom-1', 'org-1');
  });

  test('should throw NotFoundError if classroom does not exist', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce(null);

    expect(useCase.execute('org-1', 'classroom-1', 'user-1')).rejects.toThrow(
      NotFoundError
    );
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');

    expect(useCase.execute('org-1', 'classroom-1', 'user-1')).rejects.toThrow(
      ForbiddenError
    );
  });
});
