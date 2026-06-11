import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { ListAllSchedulesUseCase } from './list-all-schedules.usecase';
import { Schedule } from '../domain/schedule.entity';
import { ForbiddenError } from '@/core/errors/app.error';

describe('ListAllSchedulesUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findByScope: mock(),
    findDistinctAcademicYears: mock(),
    findAll: mock(),
    findPaginated: mock(),
    create: mock(),
    update: mock(),
    createSchedulesWithSlots: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const useCase = new ListAllSchedulesUseCase(
    repositoryMock,
    memberProviderMock
  );

  beforeEach(() => {
    repositoryMock.findAll.mockClear();
    memberProviderMock.getMemberRole.mockClear();
  });

  test('should list all schedules successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('ADMIN');
    const schedule = Schedule.reconstitute({
      id: 'sched-1',
      organizationId: 'org-1',
      degreeId: 'deg-1',
      itineraryId: null,
      academicYearId: 'ay-1',
      courseYear: 1,
      shift: 'morning',
      period: 1,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repositoryMock.findAll.mockResolvedValue([schedule]);
    const result = await useCase.execute('org-1', 'user-1');
    expect(memberProviderMock.getMemberRole).toHaveBeenCalledWith(
      'user-1',
      'org-1'
    );
    expect(repositoryMock.findAll).toHaveBeenCalledWith('org-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('sched-1');
  });

  test('should throw ForbiddenError if user is not a member', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue(null);
    await expect(useCase.execute('org-1', 'user-1')).rejects.toThrow(
      ForbiddenError
    );
    expect(repositoryMock.findAll).not.toHaveBeenCalled();
  });
});
