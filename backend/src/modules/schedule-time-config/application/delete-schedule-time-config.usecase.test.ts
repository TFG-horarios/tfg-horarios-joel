import { describe, expect, test, mock } from 'bun:test';
import { DeleteScheduleTimeConfigUseCase } from './delete-schedule-time-config.usecase';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '@/core/errors/app.error';
import { ScheduleTimeConfig } from '../domain/schedule-time-config.entity';

describe('DeleteScheduleTimeConfigUseCase', () => {
  const repositoryMock = {
    save: mock(),
    update: mock(),
    validateScope: mock(),
    findAll: mock(),
    findById: mock(),
    isReferenced: mock(),
    delete: mock(),
    deleteAll: mock(),
    findEffective: mock(),
    findPossibilities: mock(),
  };
  const memberProviderMock = { getMemberRole: mock() };
  const useCase = new DeleteScheduleTimeConfigUseCase(
    repositoryMock,
    memberProviderMock
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

  test('should delete schedule time config successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const config = ScheduleTimeConfig.reconstitute({ ...baseConfigProps });
    repositoryMock.findById.mockResolvedValueOnce(config);
    repositoryMock.isReferenced.mockResolvedValueOnce(false);

    await useCase.execute('org-1', 'ay-1', 'stc-1', 'user-1');
    expect(repositoryMock.delete).toHaveBeenCalledWith('stc-1');
  });

  test('should throw ForbiddenError if user lacks access', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    expect(useCase.execute('org-1', 'ay-1', 'stc-1', 'user-1')).rejects.toThrow(
      ForbiddenError
    );
  });

  test('should throw NotFoundError if config not found', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'ay-1', 'stc-1', 'user-1')).rejects.toThrow(
      NotFoundError
    );
  });

  test('should throw NotFoundError if organizationId mismatch', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const config = ScheduleTimeConfig.reconstitute({
      ...baseConfigProps,
      organizationId: 'org-2',
    });
    repositoryMock.findById.mockResolvedValueOnce(config);
    expect(useCase.execute('org-1', 'ay-1', 'stc-1', 'user-1')).rejects.toThrow(
      NotFoundError
    );
  });

  test('should throw ConflictError if config is referenced', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const config = ScheduleTimeConfig.reconstitute({ ...baseConfigProps });
    repositoryMock.findById.mockResolvedValueOnce(config);
    repositoryMock.isReferenced.mockResolvedValueOnce(true);
    expect(useCase.execute('org-1', 'ay-1', 'stc-1', 'user-1')).rejects.toThrow(
      ConflictError
    );
  });
});
