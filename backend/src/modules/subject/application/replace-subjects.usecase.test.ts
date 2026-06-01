import { describe, expect, test, mock } from 'bun:test';
import { ReplaceSubjectsUseCase } from './replace-subjects.usecase';
import { ForbiddenError, ValidationError } from '@/core/errors/app.error';

describe('ReplaceSubjectsUseCase', () => {
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

  const useCase = new ReplaceSubjectsUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should replace subjects successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const dtos = [
      {
        name: 'Subject A',
        code: 'SA',
        availableShifts: ['morning'] as ('morning' | 'afternoon')[],
        numberOfStudents: 10,
        courseYear: 1,
        period: 1,
        weeklyHours: 2,
        isCommon: true,
        degreeId: 'deg-1',
      },
      {
        name: 'Subject B',
        code: 'SB',
        availableShifts: ['morning'] as ('morning' | 'afternoon')[],
        numberOfStudents: 10,
        courseYear: 1,
        period: 1,
        weeklyHours: 2,
        isCommon: true,
        degreeId: 'deg-1',
      },
    ];
    const result = await useCase.execute('org-1', 'user-1', dtos);
    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe('Subject A');
    expect(result[1]?.name).toBe('Subject B');
    expect(repositoryMock.replace).toHaveBeenCalled();
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    expect(
      useCase.execute('org-1', 'user-1', [
        {
          name: 'A',
          code: 'A',
          availableShifts: ['morning'],
          numberOfStudents: 10,
          courseYear: 1,
          period: 1,
          weeklyHours: 2,
          isCommon: true,
          degreeId: 'deg-1',
        },
      ])
    ).rejects.toThrow(ForbiddenError);
  });

  test('should throw ValidationError if request contains duplicate codes', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const dtos = [
      {
        name: 'Subject A',
        code: 'SA',
        availableShifts: ['morning'] as ('morning' | 'afternoon')[],
        numberOfStudents: 10,
        courseYear: 1,
        period: 1,
        weeklyHours: 2,
        isCommon: true,
        degreeId: 'deg-1',
      },
      {
        name: 'Subject B',
        code: 'SA',
        availableShifts: ['morning'] as ('morning' | 'afternoon')[],
        numberOfStudents: 10,
        courseYear: 1,
        period: 1,
        weeklyHours: 2,
        isCommon: true,
        degreeId: 'deg-1',
      },
    ];
    expect(useCase.execute('org-1', 'user-1', dtos)).rejects.toThrow(
      ValidationError
    );
  });
});
