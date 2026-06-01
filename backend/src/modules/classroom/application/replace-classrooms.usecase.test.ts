import { describe, expect, test, mock } from 'bun:test';
import { ReplaceClassroomsUseCase } from './replace-classrooms.usecase';
import { ForbiddenError, ValidationError } from '@/core/errors/app.error';

describe('ReplaceClassroomsUseCase', () => {
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

  const useCase = new ReplaceClassroomsUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should replace classrooms successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const dtos = [
      { name: 'Room 1', capacity: 30, type: 'theory' as const },
      { name: 'Room 2', capacity: 20, type: 'lab' as const },
    ];
    const result = await useCase.execute('org-1', 'user-1', dtos);
    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe('Room 1');
    expect(result[1]?.name).toBe('Room 2');
    expect(repositoryMock.replace).toHaveBeenCalled();
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    expect(
      useCase.execute('org-1', 'user-1', [
        { name: 'A', capacity: 10, type: 'theory' as const },
      ])
    ).rejects.toThrow(ForbiddenError);
  });

  test('should throw ValidationError if request contains duplicate names', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const dtos = [
      { name: 'Room 1', capacity: 30, type: 'theory' as const },
      { name: 'Room 1', capacity: 20, type: 'lab' as const },
    ];
    expect(useCase.execute('org-1', 'user-1', dtos)).rejects.toThrow(
      ValidationError
    );
  });
});
