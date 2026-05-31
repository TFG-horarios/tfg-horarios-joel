import { describe, expect, test, mock } from 'bun:test';
import { ListSchedulesUseCase } from './list-schedules.usecase';
import { Schedule } from '../domain/schedule.entity';
import { ForbiddenError } from '@/core/errors/app.error';

describe('ListSchedulesUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findPublishedByScope: mock(),
    findLatestVersionByScope: mock(),
    findAll: mock(),
    create: mock(),
    update: mock(),
    createSchedulesWithSlots: mock(),
    publishAndArchive: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const useCase = new ListSchedulesUseCase(repositoryMock, memberProviderMock);

  test('should list schedules successfully', async () => {
    const schedule = Schedule.create({
      organizationId: 'org-1',
      degreeId: 'deg-1',
      academicYear: '2023-2024',
      shift: 'morning',
      courseYear: 1,
      period: 1,
    });
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    repositoryMock.findAll.mockResolvedValueOnce([schedule]);

    const result = await useCase.execute('org-1', 'user-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(schedule.id);
  });

  test('should throw ForbiddenError if user has no role', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'user-1')).rejects.toThrow(ForbiddenError);
  });
});
