import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { PublishScheduleUseCase } from './publish-schedule.usecase';
import { Schedule } from '../domain/schedule.entity';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

describe('PublishScheduleUseCase', () => {
  beforeEach(() => {
    repositoryMock.findById.mockClear();
    repositoryMock.update.mockClear();
  });

  const repositoryMock = {
    findById: mock(),
    findByScope: mock(),
    findAll: mock(),
    findPaginated: mock(),
    create: mock(),
    update: mock(),
    createSchedulesWithSlots: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const useCase = new PublishScheduleUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should publish schedule successfully when no previous published schedule exists', async () => {
    const schedule = Schedule.create({
      organizationId: 'org-1',
      degreeId: 'deg-1',
      academicYear: '2023-2024',
      shift: 'morning',
      courseYear: 1,
      period: 1,
    });
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce(schedule);
    repositoryMock.update.mockResolvedValueOnce(undefined);
    const result = await useCase.execute('org-1', 'user-1', schedule.id);
    expect(result.status).toBe('published');
    expect(repositoryMock.update).toHaveBeenCalledWith(schedule);
  });

  test('should return without changes if schedule is already published', async () => {
    const schedule = Schedule.create({
      organizationId: 'org-1',
      degreeId: 'deg-1',
      academicYear: '2023-2024',
      shift: 'morning',
      courseYear: 1,
      period: 1,
      status: 'published',
    });
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce(schedule);
    const result = await useCase.execute('org-1', 'user-1', schedule.id);
    expect(result.status).toBe('published');
    expect(repositoryMock.update).not.toHaveBeenCalled();
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    expect(useCase.execute('org-1', 'user-1', 'sch-1')).rejects.toThrow(
      ForbiddenError
    );
  });

  test('should throw NotFoundError if schedule does not exist', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'user-1', 'sch-1')).rejects.toThrow(
      NotFoundError
    );
  });
});
