import { describe, expect, test, mock } from 'bun:test';
import type { DbTransaction } from '@/core/db/transaction-runner';
import { DeleteClassroomUseCase } from './delete-classroom.usecase';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

describe('DeleteClassroomUseCase', () => {
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
    replace: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const useCase = new DeleteClassroomUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should delete classroom successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce({
      id: 'classroom-1',
    });
    await useCase.execute('org-1', 'classroom-1', 'user-1');
    expect(repositoryMock.delete).toHaveBeenCalledWith('classroom-1', 'org-1');
  });

  test('should throw NotFoundError if classroom does not exist', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'classroom-1', 'user-1')).rejects.toThrow(
      NotFoundError
    );
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    expect(useCase.execute('org-1', 'classroom-1', 'user-1')).rejects.toThrow(
      ForbiddenError
    );
  });

  test('should propagate deletion and reevaluate affected schedules atomically', async () => {
    const tx = { id: 'tx' };
    const repository = {
      ...repositoryMock,
      findById: mock(async () => ({ id: 'classroom-1' })),
      delete: mock(async () => undefined),
    };
    const memberProvider = {
      getMemberRole: mock(async () => 'admin' as const),
    };
    const academicYearRepository = {
      findActiveAndFutureIds: mock(async () => ['year-1']),
    };
    const scheduleProvider = {
      handleClassroomsDeletion: mock(async () => undefined),
    };
    const runInTransaction = mock(
      async (work: (tx: DbTransaction) => Promise<void>) =>
        work(tx as unknown as DbTransaction)
    );
    const transactionalUseCase = new DeleteClassroomUseCase(
      repository as any,
      memberProvider,
      academicYearRepository as any,
      scheduleProvider,
      runInTransaction as any
    );

    await transactionalUseCase.execute('org-1', 'classroom-1', 'user-1');

    expect(repository.delete).toHaveBeenCalledWith('classroom-1', 'org-1', tx);
    expect(scheduleProvider.handleClassroomsDeletion).toHaveBeenCalledWith(
      ['classroom-1'],
      'org-1',
      ['year-1'],
      tx
    );
  });
});
