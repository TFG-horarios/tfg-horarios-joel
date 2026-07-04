import { describe, expect, test, mock } from 'bun:test';
import type { DbTransaction } from '@/core/db/transaction-runner';
import { BulkCreateSubjectGroupUseCase } from './bulk-create-subject-group.usecase';
import { ValidationError } from '@/core/errors/app.error';

describe('BulkCreateSubjectGroupUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findAll: mock(),
    findPaginated: mock(),
    findIdentifiers: mock(),
    findGroupsWithSubjectsInScope: mock(),
    create: mock(),
    createMany: mock(),
    update: mock(),
    delete: mock(),
    deleteAll: mock(),
    replace: mock(),
  };

  const subjectProviderMock = { getAvailableShifts: mock() };
  const memberProviderMock = { getMemberRole: mock() };

  const useCase = new BulkCreateSubjectGroupUseCase(
    repositoryMock,
    subjectProviderMock,
    memberProviderMock
  );

  test('should bulk create groups successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    subjectProviderMock.getAvailableShifts.mockResolvedValueOnce(['morning']);
    const dtos = [
      {
        name: 'T1',
        groupType: 'theory' as const,
        shift: 'morning' as const,
        groupNumber: 1,
        weeklyHours: 4,
        numberOfStudents: 30,
        needsComputerLab: false,
        subjectId: 'sub-1',
      },
    ];
    const result = await useCase.execute('org-1', 'user-1', dtos);
    expect(result).toHaveLength(1);
    expect(repositoryMock.createMany).toHaveBeenCalled();
  });

  test('should throw ValidationError on duplicate groups in request', async () => {
    const dtos = [
      {
        name: 'T1',
        groupType: 'theory' as const,
        shift: 'morning' as const,
        groupNumber: 1,
        weeklyHours: 4,
        numberOfStudents: 30,
        needsComputerLab: false,
        subjectId: 'sub-1',
      },
      {
        name: 'T1',
        groupType: 'theory' as const,
        shift: 'morning' as const,
        groupNumber: 1,
        weeklyHours: 4,
        numberOfStudents: 30,
        needsComputerLab: false,
        subjectId: 'sub-1',
      },
    ];
    expect(useCase.execute('org-1', 'user-1', dtos)).rejects.toThrow(
      ValidationError
    );
  });

  test('should add all new groups to existing schedules as unassigned', async () => {
    const tx = { id: 'tx-1' };
    const scheduleProvider = {
      handleSubjectGroupsCreation: mock(async () => undefined),
      handleSubjectGroupsDeletion: mock(),
      replaceSubjectGroups: mock(),
    };
    const transactionalUseCase = new BulkCreateSubjectGroupUseCase(
      repositoryMock,
      subjectProviderMock,
      memberProviderMock,
      { findActiveAndFutureIds: mock(async () => ['year-1']) } as any,
      scheduleProvider,
      async <T>(work: (tx: DbTransaction) => Promise<T>) =>
        work(tx as unknown as DbTransaction)
    );
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    subjectProviderMock.getAvailableShifts.mockResolvedValueOnce(['morning']);

    const result = await transactionalUseCase.execute('org-1', 'user-1', [
      {
        name: 'T2',
        groupType: 'theory',
        shift: 'morning',
        groupNumber: 2,
        weeklyHours: 2,
        numberOfStudents: 25,
        needsComputerLab: false,
        subjectId: 'sub-1',
      },
    ]);

    expect(repositoryMock.createMany).toHaveBeenCalledWith(
      expect.anything(),
      tx
    );
    expect(scheduleProvider.handleSubjectGroupsCreation).toHaveBeenCalledWith(
      [result[0]!.id],
      'org-1',
      ['year-1'],
      tx
    );
  });
});
