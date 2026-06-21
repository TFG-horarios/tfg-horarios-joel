import { describe, expect, test, mock } from 'bun:test';
import { UnpublishScheduleUseCase } from './unpublish-schedule.usecase';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { Schedule } from '../domain/schedule.entity';

describe('UnpublishScheduleUseCase', () => {
  const scheduleRepositoryMock = {
    save: mock(),
    findByScope: mock(),
    findAll: mock(),
    findById: mock(),
    delete: mock(),
    update: mock(),
    findDistinctAcademicYears: mock(),
    findPaginated: mock(),
    create: mock(),
    createSchedulesWithSlots: mock(),
    findLockedAssignments: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const useCase = new UnpublishScheduleUseCase(
    scheduleRepositoryMock,
    memberProviderMock
  );

  test('should unpublish schedule successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('admin');

    const schedule = Schedule.create({
      organizationId: 'org-1',
      academicYearId: 'year-1',
      degreeId: 'deg-1',
      itineraryId: null,
      courseYear: 1,
      period: 1,
      shift: 'morning',
      status: 'published',
    });
    scheduleRepositoryMock.findById.mockResolvedValue(schedule);
    scheduleRepositoryMock.update.mockResolvedValue(undefined);

    const result = await useCase.execute('org-1', 'user-1', schedule.id);

    expect(result.status).toBe('draft');
    expect(scheduleRepositoryMock.update).toHaveBeenCalled();
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('viewer');

    expect(useCase.execute('org-1', 'user-1', 'sch-1')).rejects.toThrow(
      ForbiddenError
    );
  });

  test('should throw NotFoundError if schedule not found', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('admin');
    scheduleRepositoryMock.findById.mockResolvedValue(null);

    expect(useCase.execute('org-1', 'user-1', 'sch-1')).rejects.toThrow(
      NotFoundError
    );
  });
});
