import { describe, expect, test, mock } from 'bun:test';
import { GetScheduleUseCase } from './get-schedule.usecase';
import { Schedule } from '../domain/schedule.entity';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

describe('GetScheduleUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findByScope: mock(),
    findDistinctAcademicYears: mock(),
    findAll: mock(),
    findPaginated: mock(),
    create: mock(),
    update: mock(),
    createSchedulesWithSlots: mock(),
    findLockedAssignments: mock(),
    delete: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const useCase = new GetScheduleUseCase(repositoryMock, memberProviderMock);

  test('should retrieve schedule successfully', async () => {
    const schedule = Schedule.create({
      organizationId: 'org-1',
      degreeId: 'deg-1',
      academicYearId: 'ay-1',
      shift: 'morning',
      courseYear: 1,
      period: 1,
    });
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    repositoryMock.findById.mockResolvedValueOnce(schedule);
    const result = await useCase.execute('org-1', 'user-1', schedule.id);
    expect(result.id).toBe(schedule.id);
  });

  test('should throw ForbiddenError if user has no role', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'user-1', 'sch-1')).rejects.toThrow(
      ForbiddenError
    );
  });

  test('should throw NotFoundError if schedule does not exist', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    repositoryMock.findById.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'user-1', 'sch-1')).rejects.toThrow(
      NotFoundError
    );
  });
});
