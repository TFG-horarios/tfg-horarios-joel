import { describe, expect, test, mock } from 'bun:test';
import { CreateClassroomUseCase } from './create-classroom.usecase';
import { ForbiddenError } from '@/core/errors/app.error';

describe('CreateClassroomUseCase', () => {
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

  const useCase = new CreateClassroomUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should create a classroom successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const dto = { name: 'Lab A', capacity: 20, type: 'lab' as const };
    const result = await useCase.execute('org-1', 'user-1', dto);
    expect(result.name).toBe('Lab A');
    expect(result.organizationId).toBe('org-1');
    expect(repositoryMock.create).toHaveBeenCalled();
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    const dto = { name: 'Lab A', capacity: 20, type: 'lab' as const };
    expect(useCase.execute('org-1', 'user-1', dto)).rejects.toThrow(
      ForbiddenError
    );
  });
});
