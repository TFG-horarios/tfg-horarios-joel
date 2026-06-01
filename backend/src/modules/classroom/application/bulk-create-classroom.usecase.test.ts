import { describe, expect, test, mock } from 'bun:test';
import { BulkCreateClassroomsUseCase } from './bulk-create-classroom.usecase';
import { ForbiddenError, ValidationError } from '@/core/errors/app.error';

describe('BulkCreateClassroomsUseCase', () => {
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

  const useCase = new BulkCreateClassroomsUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should create multiple classrooms successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const dtos = [
      { name: 'Lab A', capacity: 20, type: 'lab' as const },
      { name: 'Theory B', capacity: 40, type: 'theory' as const },
    ];
    const result = await useCase.execute('org-1', 'user-1', dtos);
    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe('Lab A');
    expect(result[1]?.name).toBe('Theory B');
    expect(repositoryMock.createMany).toHaveBeenCalled();
  });

  test('should throw ValidationError if no data provided', async () => {
    expect(useCase.execute('org-1', 'user-1', [])).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ValidationError if duplicate names in request', async () => {
    const dtos = [
      { name: 'Lab A', capacity: 20, type: 'lab' as const },
      { name: 'Lab A', capacity: 40, type: 'theory' as const },
    ];
    expect(useCase.execute('org-1', 'user-1', dtos)).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    const dtos = [{ name: 'Lab A', capacity: 20, type: 'lab' as const }];
    expect(useCase.execute('org-1', 'user-1', dtos)).rejects.toThrow(
      ForbiddenError
    );
  });
});
