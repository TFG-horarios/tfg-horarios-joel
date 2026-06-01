import { describe, expect, test, mock } from 'bun:test';
import { BulkCreateDegreesUseCase } from './bulk-create-degree.usecase';
import { ForbiddenError, ValidationError } from '@/core/errors/app.error';

describe('BulkCreateDegreesUseCase', () => {
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

  const useCase = new BulkCreateDegreesUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should create multiple degrees successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const dtos = [
      { name: 'Computer Science', code: 'CS' },
      { name: 'Software Eng', code: 'SE' },
    ];
    const result = await useCase.execute('org-1', 'user-1', dtos);
    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe('Computer Science');
    expect(repositoryMock.createMany).toHaveBeenCalled();
  });

  test('should throw ValidationError if no data provided', async () => {
    expect(useCase.execute('org-1', 'user-1', [])).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ValidationError if duplicate names in request', async () => {
    const dtos = [
      { name: 'CS', code: 'CS' },
      { name: 'CS', code: 'SE' },
    ];
    expect(useCase.execute('org-1', 'user-1', dtos)).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    const dtos = [{ name: 'CS', code: 'CS' }];
    expect(useCase.execute('org-1', 'user-1', dtos)).rejects.toThrow(
      ForbiddenError
    );
  });
});
