import { describe, expect, test, mock } from 'bun:test';
import { GetActiveAcademicYearUseCase } from './get-active-academic-year.usecase';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { AcademicYear } from '../domain/academic-year.entity';

describe('GetActiveAcademicYearUseCase', () => {
  const repositoryMock = {
    save: mock(),
    findById: mock(),
    findByOrganizationId: mock(),
    delete: mock(),
    update: mock(),
    findActiveByOrganizationId: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const useCase = new GetActiveAcademicYearUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should return active academic year successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('VIEWER');

    const academicYear = AcademicYear.create({
      organizationId: 'org-1',
      name: '2024-2025',
      periodType: 'semester',
      period0Start: null,
      period0End: null,
      period1Start: null,
      period1End: null,
      period2Start: null,
      period2End: null,
      morningStart: '08:00',
      morningEnd: '14:00',
      afternoonStart: '15:00',
      afternoonEnd: '21:00',
      slotDurationMinutes: 60,
    });
    repositoryMock.findActiveByOrganizationId.mockResolvedValue(academicYear);

    const result = await useCase.execute('org-1', 'user-1');

    expect(result.id).toBe(academicYear.id);
  });

  test('should throw ForbiddenError if user has no role', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue(null);

    expect(useCase.execute('org-1', 'user-1')).rejects.toThrow(ForbiddenError);
  });

  test('should throw NotFoundError if active academic year is not found', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('VIEWER');
    repositoryMock.findActiveByOrganizationId.mockResolvedValue(null);

    expect(useCase.execute('org-1', 'user-1')).rejects.toThrow(NotFoundError);
  });
});
