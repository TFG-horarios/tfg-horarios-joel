import { describe, expect, test, mock } from 'bun:test';
import { CreateSubjectUseCase } from './create-subject.usecase';
import { ForbiddenError } from '@/core/errors/app.error';

describe('CreateSubjectUseCase', () => {
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
  const useCase = new CreateSubjectUseCase(repositoryMock, memberProviderMock);

  test('should create subject successfully', async () => {
    (
      memberProviderMock.getMemberRole as ReturnType<typeof mock>
    ).mockResolvedValueOnce('admin');
    const dto = {
      name: 'Math',
      code: 'M1',
      availableShifts: ['morning'] as ('morning' | 'afternoon')[],
      numberOfStudents: 30,
      courseYear: 1,
      period: 1,
      weeklyHours: 4,
      isCommon: true,
    };
    const result = await useCase.execute('org-1', 'deg-1', 'user-1', dto);
    expect(result.name).toBe('Math');
    expect(repositoryMock.create).toHaveBeenCalled();
  });

  test('should throw ForbiddenError if lacking permission', async () => {
    (
      memberProviderMock.getMemberRole as ReturnType<typeof mock>
    ).mockResolvedValueOnce('viewer');
    const dto = {
      name: 'Math',
      code: 'M1',
      availableShifts: ['morning'] as ('morning' | 'afternoon')[],
      numberOfStudents: 30,
      courseYear: 1,
      period: 1,
      weeklyHours: 4,
      isCommon: true,
    };
    expect(useCase.execute('org-1', 'deg-1', 'user-1', dto)).rejects.toThrow(
      ForbiddenError
    );
  });
});
