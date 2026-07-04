import type { Shift } from '@tfg-horarios/shared';
import { describe, expect, test, mock } from 'bun:test';
import type { DbTransaction } from '@/core/db/transaction-runner';
import { ReplaceSubjectGroupsUseCase } from './replace-subject-groups.usecase';
import { ForbiddenError, ValidationError } from '@/core/errors/app.error';

describe('ReplaceSubjectGroupsUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findAll: mock(),
    findPaginated: mock(),
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

  const academicYearProviderMock = {
    shouldIncludeSoftDeleted: mock(),
    findActiveAndFutureIds: mock(),
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
        shift: 'morning' as Shift,
        groupNumber: 1,
        weeklyHours: 2,
        numberOfStudents: 10,
        needsComputerLab: false,
        subjectId: 'sub-1',
      },
      {
        name: 'Group 2',
        groupType: 'practices' as 'theory' | 'practices',
        shift: 'morning' as Shift,
        groupNumber: 1,
        weeklyHours: 2,
        numberOfStudents: 10,
        needsComputerLab: false,
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
          shift: 'morning' as Shift,
          groupNumber: 1,
          weeklyHours: 2,
          numberOfStudents: 10,
          needsComputerLab: false,
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
        shift: 'morning' as Shift,
        groupNumber: 1,
        weeklyHours: 2,
        numberOfStudents: 10,
        needsComputerLab: false,
        subjectId: 'sub-1',
      },
      {
        name: 'Group 2',
        groupType: 'theory' as 'theory' | 'practices',
        shift: 'morning' as Shift,
        groupNumber: 1,
        weeklyHours: 2,
        numberOfStudents: 10,
        needsComputerLab: false,
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
        shift: 'afternoon' as Shift,
        groupNumber: 1,
        weeklyHours: 2,
        numberOfStudents: 10,
        needsComputerLab: false,
        subjectId: 'sub-1',
      },
    ];
    expect(useCase.execute('org-1', 'user-1', dtos)).rejects.toThrow(
      ValidationError
    );
  });

  test('should replace the slots of existing schedules', async () => {
    const tx = { id: 'tx-1' };
    const scheduleProvider = {
      handleSubjectGroupsDeletion: mock(),
      handleSubjectGroupsCreation: mock(),
      replaceSubjectGroups: mock(async () => undefined),
    };
    repositoryMock.findAll.mockResolvedValueOnce([{ id: 'old-group' }]);
    const transactionalUseCase = new ReplaceSubjectGroupsUseCase(
      repositoryMock,
      memberProviderMock,
      subjectProviderMock,
      academicYearProviderMock,
      scheduleProvider,
      async <T>(work: (tx: DbTransaction) => Promise<T>) =>
        work(tx as unknown as DbTransaction)
    );
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    subjectProviderMock.getAvailableShifts.mockResolvedValueOnce(['morning']);
    academicYearProviderMock.findActiveAndFutureIds.mockResolvedValueOnce([
      'year-1',
    ]);

    const result = await transactionalUseCase.execute('org-1', 'user-1', [
      {
        name: 'New group',
        groupType: 'theory',
        shift: 'morning',
        groupNumber: 1,
        weeklyHours: 2,
        numberOfStudents: 10,
        needsComputerLab: false,
        subjectId: 'sub-1',
      },
    ]);

    expect(repositoryMock.replace).toHaveBeenCalledWith(
      expect.anything(),
      'org-1',
      tx
    );
    expect(scheduleProvider.replaceSubjectGroups).toHaveBeenCalledWith(
      ['old-group'],
      [result[0]!.id],
      'org-1',
      ['year-1'],
      tx
    );
  });
});
