import { describe, expect, test, mock } from 'bun:test';
import { BulkCreateSubjectUseCase } from './bulk-create-subject.usecase';
import { ForbiddenError, ValidationError } from '@/core/errors/app.error';

describe('BulkCreateSubjectUseCase', () => {
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

  const memberProviderMock = { getMemberRole: mock() };

  const useCase = new BulkCreateSubjectUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should bulk create subjects successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const dtos = [
      {
        name: 'Math',
        code: 'M1',
        availableShifts: ['morning'] as ('morning' | 'afternoon')[],
        numberOfStudents: 30,
        courseYear: 1,
        period: 1,
        weeklyHours: 4,
        isCommon: true,
        degreeId: 'deg-1',
      },
    ];
    const result = await useCase.execute('org-1', 'user-1', dtos);
    expect(result).toHaveLength(1);
    expect(repositoryMock.createMany).toHaveBeenCalled();
  });

  test('should throw ValidationError if empty list provided', async () => {
    expect(useCase.execute('org-1', 'user-1', [])).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ValidationError on duplicate code', async () => {
    const dtos = [
      {
        name: 'Math',
        code: 'M1',
        availableShifts: ['morning'] as ('morning' | 'afternoon')[],
        numberOfStudents: 30,
        courseYear: 1,
        period: 1,
        weeklyHours: 4,
        isCommon: true,
        degreeId: 'deg-1',
      },
      {
        name: 'Math 2',
        code: 'M1',
        availableShifts: ['morning'] as ('morning' | 'afternoon')[],
        numberOfStudents: 30,
        courseYear: 1,
        period: 1,
        weeklyHours: 4,
        isCommon: true,
        degreeId: 'deg-1',
      },
    ];
    expect(useCase.execute('org-1', 'user-1', dtos)).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ForbiddenError if lacking permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    const dtos = [
      {
        name: 'Math',
        code: 'M1',
        availableShifts: ['morning'] as ('morning' | 'afternoon')[],
        numberOfStudents: 30,
        courseYear: 1,
        period: 1,
        weeklyHours: 4,
        isCommon: true,
        degreeId: 'deg-1',
      },
    ];
    expect(useCase.execute('org-1', 'user-1', dtos)).rejects.toThrow(
      ForbiddenError
    );
  });
});
