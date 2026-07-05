import { describe, expect, test, mock } from 'bun:test';
import { UpdateScheduleTimeConfigUseCase } from './update-schedule-time-config.usecase';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { ScheduleTimeConfig } from '../domain/schedule-time-config.entity';
import type { ScheduleTimeConfigGridValidator } from './schedule-time-config-grid.validator';
import type { DbTransaction } from '@/core/db/transaction-runner';

describe('UpdateScheduleTimeConfigUseCase', () => {
  const repositoryMock = {
    save: mock(),
    update: mock(),
    validateScope: mock(),
    findAll: mock(),
    findById: mock(),
    delete: mock(),
    deleteAll: mock(),
    isReferenced: mock(),
    findPossibilities: mock(),
    findEffective: mock(),
  };
  const memberProviderMock = { getMemberRole: mock() };
  const gridValidatorMock = { validate: mock() };
  const timingChangeProviderMock = { invalidateForTimingChange: mock() };
  const timingChangeNotifierMock = { notifyTimingChange: mock() };

  const tx = { id: 'tx' };

  const useCase = new UpdateScheduleTimeConfigUseCase(
    repositoryMock,
    memberProviderMock,
    gridValidatorMock as unknown as ScheduleTimeConfigGridValidator,
    timingChangeProviderMock,
    async <T>(work: (tx: DbTransaction) => Promise<T>) =>
      work(tx as unknown as DbTransaction),
    timingChangeNotifierMock
  );

  const baseConfigProps = {
    id: 'stc-1',
    organizationId: 'org-1',
    academicYearId: 'ay-1',
    degreeId: 'deg-1',
    itineraryId: null,
    courseYear: 1,
    period: 1,
    shift: 'morning' as const,
    startTime: '08:00',
    endTime: '14:00',
    hasBreak: true,
    breakAfterSlot: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const validUpdateData = {
    startTime: '09:00',
    endTime: '15:00',
    hasBreak: false,
    breakAfterSlot: null,
  };

  test('should update schedule time config successfully without transaction if timing not changed', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const config = ScheduleTimeConfig.reconstitute({ ...baseConfigProps });
    repositoryMock.findById.mockResolvedValueOnce(config);
    gridValidatorMock.validate.mockResolvedValueOnce(undefined);

    const result = await useCase.execute('org-1', 'ay-1', 'stc-1', 'user-1', {
      startTime: '08:00',
      endTime: '14:00',
      hasBreak: true,
      breakAfterSlot: 3,
    });

    expect(result.id).toBe('stc-1');
    expect(repositoryMock.update).toHaveBeenCalledWith(config);
  });

  test('should update schedule time config in transaction if timing changed', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const config = ScheduleTimeConfig.reconstitute({ ...baseConfigProps });
    repositoryMock.findById.mockResolvedValueOnce(config);
    gridValidatorMock.validate.mockResolvedValueOnce(undefined);

    const invalidationResult = { issues: 1 };
    timingChangeProviderMock.invalidateForTimingChange.mockResolvedValueOnce(
      invalidationResult
    );

    const result = await useCase.execute(
      'org-1',
      'ay-1',
      'stc-1',
      'user-1',
      validUpdateData
    );

    expect(result.startTime).toBe('09:00');
    expect(timingChangeNotifierMock.notifyTimingChange).toHaveBeenCalledWith(
      'org-1',
      invalidationResult
    );
  });

  test('should throw ForbiddenError if user lacks access', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    expect(
      useCase.execute('org-1', 'ay-1', 'stc-1', 'user-1', validUpdateData)
    ).rejects.toThrow(ForbiddenError);
  });

  test('should throw NotFoundError if config not found', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce(null);
    expect(
      useCase.execute('org-1', 'ay-1', 'stc-1', 'user-1', validUpdateData)
    ).rejects.toThrow(NotFoundError);
  });

  test('should throw NotFoundError if organizationId mismatch', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const config = ScheduleTimeConfig.reconstitute({
      ...baseConfigProps,
      organizationId: 'org-2',
    });
    repositoryMock.findById.mockResolvedValueOnce(config);
    expect(
      useCase.execute('org-1', 'ay-1', 'stc-1', 'user-1', validUpdateData)
    ).rejects.toThrow(NotFoundError);
  });
});
