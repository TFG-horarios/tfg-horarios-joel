import { describe, expect, test, mock } from 'bun:test';
import { ReplaceSubjectGroupsUseCase } from './replace-subject-groups.usecase';
import { ForbiddenError, ValidationError } from '@/core/errors/app.error';

describe('ReplaceSubjectGroupsUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findAll: mock(),
    findIdentifiers: mock(),
    create: mock(),
    createMany: mock(),
    update: mock(),
    delete: mock(),
    deleteAll: mock(),
    findGroupsWithSubjectsInScope: mock(),
    replace: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const subjectProviderMock = {
    getAvailableShifts: mock(),
  };

  const useCase = new ReplaceSubjectGroupsUseCase(
    repositoryMock,
    memberProviderMock,
    subjectProviderMock
  );

  test('should replace groups successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    subjectProviderMock.getAvailableShifts.mockResolvedValue(['morning']);
    const dtos = [
      {
        name: 'Group 1',
        groupType: 'theory' as 'theory' | 'practices',
        shift: 'morning' as 'morning' | 'afternoon',
        groupNumber: 1,
        weeklyHours: 2,
        numberOfStudents: 10,
        subjectId: 'sub-1',
      },
      {
        name: 'Group 2',
        groupType: 'practices' as 'theory' | 'practices',
        shift: 'morning' as 'morning' | 'afternoon',
        groupNumber: 1,
        weeklyHours: 2,
        numberOfStudents: 10,
        subjectId: 'sub-1',
      },
    ];
    const result = await useCase.execute('org-1', 'user-1', dtos);
    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe('Group 1');
    expect(result[1]?.name).toBe('Group 2');
    expect(repositoryMock.replace).toHaveBeenCalled();
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    expect(
      useCase.execute('org-1', 'user-1', [
        {
          name: 'A',
          groupType: 'theory' as 'theory' | 'practices',
          shift: 'morning' as 'morning' | 'afternoon',
          groupNumber: 1,
          weeklyHours: 2,
          numberOfStudents: 10,
          subjectId: 'sub-1',
        },
      ])
    ).rejects.toThrow(ForbiddenError);
  });

  test('should throw ValidationError if request contains duplicate groups', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const dtos = [
      {
        name: 'Group 1',
        groupType: 'theory' as 'theory' | 'practices',
        shift: 'morning' as 'morning' | 'afternoon',
        groupNumber: 1,
        weeklyHours: 2,
        numberOfStudents: 10,
        subjectId: 'sub-1',
      },
      {
        name: 'Group 2',
        groupType: 'theory' as 'theory' | 'practices',
        shift: 'morning' as 'morning' | 'afternoon',
        groupNumber: 1,
        weeklyHours: 2,
        numberOfStudents: 10,
        subjectId: 'sub-1',
      },
    ];
    expect(useCase.execute('org-1', 'user-1', dtos)).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ValidationError if shift is not available', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    subjectProviderMock.getAvailableShifts.mockResolvedValueOnce(['morning']);
    const dtos = [
      {
        name: 'Group 1',
        groupType: 'theory' as 'theory' | 'practices',
        shift: 'afternoon' as 'morning' | 'afternoon',
        groupNumber: 1,
        weeklyHours: 2,
        numberOfStudents: 10,
        subjectId: 'sub-1',
      },
    ];
    expect(useCase.execute('org-1', 'user-1', dtos)).rejects.toThrow(
      ValidationError
    );
  });
});
