import { describe, expect, test, mock } from 'bun:test';
import { CreateScheduleTimeConfigUseCase } from './create-schedule-time-config.usecase';
import {
  ForbiddenError,
  ValidationError,
  ConflictError,
} from '@/core/errors/app.error';
import { ScheduleTimeConfigGridValidator } from './schedule-time-config-grid.validator';

describe('CreateScheduleTimeConfigUseCase', () => {
  const repositoryMock = {
    save: mock(),
    validateScope: mock(),
    findAll: mock(),
    findById: mock(),
    delete: mock(),
    deleteAll: mock(),
    findEffective: mock(),
    update: mock(),
    findPossibilities: mock(),
    isReferenced: mock(),
  };
  const memberProviderMock = { getMemberRole: mock() };
  const gridValidatorMock = { validate: mock() };

  const useCase = new CreateScheduleTimeConfigUseCase(
    repositoryMock,
    memberProviderMock,
    gridValidatorMock as unknown as ScheduleTimeConfigGridValidator
  );

  const validData = {
    degreeId: 'deg-1',
    itineraryId: null,
    courseYear: 1,
    period: 1,
    shift: 'morning' as const,
    startTime: '08:00',
    endTime: '14:00',
    hasBreak: true,
    breakAfterSlot: 3,
  };

  test('should create schedule time config successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.validateScope.mockResolvedValueOnce(true);
    repositoryMock.findAll.mockResolvedValueOnce([]);
    gridValidatorMock.validate.mockResolvedValueOnce(undefined);

    const result = await useCase.execute('org-1', 'ay-1', 'user-1', validData);
    expect(result.id).toBeString();
    expect(result.startTime).toBe('08:00');
    expect(repositoryMock.save).toHaveBeenCalled();
  });

  test('should throw ForbiddenError if user lacks access', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    expect(
      useCase.execute('org-1', 'ay-1', 'user-1', validData)
    ).rejects.toThrow(ForbiddenError);
  });

  test('should throw ValidationError if scope is invalid', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.validateScope.mockResolvedValueOnce(false);
    expect(
      useCase.execute('org-1', 'ay-1', 'user-1', validData)
    ).rejects.toThrow(ValidationError);
  });

  test('should throw ConflictError if config already exists for scope', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.validateScope.mockResolvedValueOnce(true);
    repositoryMock.findAll.mockResolvedValueOnce([{ itineraryId: null }]);

    expect(
      useCase.execute('org-1', 'ay-1', 'user-1', validData)
    ).rejects.toThrow(ConflictError);
  });
});
