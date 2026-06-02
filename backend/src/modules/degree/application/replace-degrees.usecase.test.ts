import { describe, expect, test, mock } from 'bun:test';
import { ReplaceDegreesUseCase } from './replace-degrees.usecase';
import { ForbiddenError, ValidationError } from '@/core/errors/app.error';

describe('ReplaceDegreesUseCase', () => {
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

  const useCase = new ReplaceDegreesUseCase(repositoryMock, memberProviderMock);

  test('should replace degrees successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const dtos = [
      { name: 'Degree A', code: 'DA' },
      { name: 'Degree B', code: 'DB' },
    ];
    const result = await useCase.execute('org-1', 'user-1', dtos);
    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe('Degree A');
    expect(result[1]?.name).toBe('Degree B');
    expect(repositoryMock.replace).toHaveBeenCalled();
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    expect(
      useCase.execute('org-1', 'user-1', [{ name: 'A', code: 'A' }])
    ).rejects.toThrow(ForbiddenError);
  });

  test('should throw ValidationError if request contains duplicate names', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const dtos = [
      { name: 'Degree A', code: 'DA' },
      { name: 'Degree A', code: 'DX' },
    ];
    expect(useCase.execute('org-1', 'user-1', dtos)).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ValidationError if request contains duplicate codes', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const dtos = [
      { name: 'Degree A', code: 'DA' },
      { name: 'Degree B', code: 'DA' },
    ];
    expect(useCase.execute('org-1', 'user-1', dtos)).rejects.toThrow(
      ValidationError
    );
  });
});
