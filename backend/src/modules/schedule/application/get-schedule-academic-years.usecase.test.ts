import { expect, test, describe, mock } from 'bun:test';
import { GetScheduleAcademicYearsUseCase } from './get-schedule-academic-years.usecase';
import { ForbiddenError } from '@/core/errors/app.error';
import type { AcademicYear } from '@tfg-horarios/shared';

describe('GetScheduleAcademicYearsUseCase', () => {
  const mockRepo = {
    findById: mock(),
    findByScope: mock(),
    findDistinctAcademicYears: mock(),
    findAll: mock(),
    findPaginated: mock(),
    create: mock(),
    update: mock(),
    createSchedulesWithSlots: mock(),
  };

  const mockMemberProvider = {
    getMemberRole: mock(),
  };

  const usecase = new GetScheduleAcademicYearsUseCase(
    mockRepo,
    mockMemberProvider
  );

  test('should retrieve academic years successfully', async () => {
    mockMemberProvider.getMemberRole.mockResolvedValueOnce('admin');
    mockRepo.findDistinctAcademicYears.mockResolvedValueOnce([
      '2025-2026',
      '2026-2027',
    ]);
    const result = await usecase.execute('org-1', 'user-1');
    expect(result).toEqual(['2025-2026', '2026-2027'] as AcademicYear[]);
    expect(mockRepo.findDistinctAcademicYears).toHaveBeenCalledWith('org-1');
  });

  test('should throw ForbiddenError if user has no role', async () => {
    mockMemberProvider.getMemberRole.mockResolvedValueOnce(null);
    expect(usecase.execute('org-1', 'user-1')).rejects.toThrow(ForbiddenError);
  });
});
