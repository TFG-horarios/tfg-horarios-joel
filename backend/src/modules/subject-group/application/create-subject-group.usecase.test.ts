import { describe, expect, test, mock } from 'bun:test';
import type { DbTransaction } from '@/core/db/transaction-runner';
import { CreateSubjectGroupUseCase } from './create-subject-group.usecase';
import { ValidationError } from '@/core/errors/app.error';

describe('CreateSubjectGroupUseCase', () => {
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

  const useCase = new CreateSubjectGroupUseCase(
    repositoryMock,
    subjectProviderMock,
    memberProviderMock
  );

  test('should create group successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    subjectProviderMock.getAvailableShifts.mockResolvedValueOnce(['morning']);
    const dto = {
      name: 'T1',
      groupType: 'theory' as const,
      shift: 'morning' as const,
      groupNumber: 1,
      weeklyHours: 4,
      numberOfStudents: 30,
      needsComputerLab: false,
    };
    const result = await useCase.execute('org-1', 'sub-1', 'user-1', dto);
    expect(result.name).toBe('T1');
    expect(repositoryMock.create).toHaveBeenCalled();
  });

  test('should throw ValidationError if shift not available', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    subjectProviderMock.getAvailableShifts.mockResolvedValueOnce(['afternoon']);
    const dto = {
      name: 'T1',
      groupType: 'theory' as const,
      shift: 'morning' as const,
      groupNumber: 1,
      weeklyHours: 4,
      numberOfStudents: 30,
      needsComputerLab: false,
    };
    expect(useCase.execute('org-1', 'sub-1', 'user-1', dto)).rejects.toThrow(
      ValidationError
    );
  });

  test('should add the new group to existing schedules as unassigned', async () => {
    const tx = { id: 'tx-1' };
    const scheduleProvider = {
      handleSubjectGroupsCreation: mock(async () => undefined),
      handleSubjectGroupsDeletion: mock(),
      replaceSubjectGroups: mock(),
    };
    const transactionalUseCase = new CreateSubjectGroupUseCase(
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

    const result = await transactionalUseCase.execute(
      'org-1',
      'sub-1',
      'user-1',
      {
        name: 'T2',
        groupType: 'theory',
        shift: 'morning',
        groupNumber: 2,
        weeklyHours: 2,
        numberOfStudents: 25,
        needsComputerLab: false,
      }
    );

    expect(repositoryMock.create).toHaveBeenCalledWith(expect.anything(), tx);
    expect(scheduleProvider.handleSubjectGroupsCreation).toHaveBeenCalledWith(
      [result.id],
      'org-1',
      ['year-1'],
      tx
    );
  });
});
