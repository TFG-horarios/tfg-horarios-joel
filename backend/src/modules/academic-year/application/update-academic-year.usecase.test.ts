import { describe, expect, test, mock } from 'bun:test';
import { UpdateAcademicYearUseCase } from './update-academic-year.usecase';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { AcademicYear } from '../domain/academic-year.entity';

describe('UpdateAcademicYearUseCase', () => {
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

  const notificationProviderMock = {
    notifyReservationsCancelled: mock(),
  };

  const useCase = new UpdateAcademicYearUseCase(
    repositoryMock,
    memberProviderMock,
    notificationProviderMock
  );

  test('should update academic year successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('admin');

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
      breakDurationMinutes: 30,
      centerOpeningTime: '08:00',
      centerClosingTime: '22:00',
      slotDurationMinutes: 60,
    });
    repositoryMock.findById.mockResolvedValue(academicYear);
    repositoryMock.update.mockResolvedValue(undefined);

    const dto = {
      name: '2025-2026',
      periodType: 'semester' as const,
      breakDurationMinutes: 30,
      centerOpeningTime: '08:00',
      centerClosingTime: '22:00',
      slotDurationMinutes: 60,
    };

    const result = await useCase.execute(
      'org-1',
      academicYear.id,
      'user-1',
      dto
    );

    expect(result.name).toBe('2025-2026');
    expect(repositoryMock.update).toHaveBeenCalled();
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('viewer');

    const dto = {
      name: '2025-2026',
      periodType: 'semester' as const,
      breakDurationMinutes: 30,
      centerOpeningTime: '08:00',
      centerClosingTime: '22:00',
      slotDurationMinutes: 60,
    };

    expect(useCase.execute('org-1', 'year-1', 'user-1', dto)).rejects.toThrow(
      ForbiddenError
    );
  });

  test('should throw NotFoundError if academic year is not found', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('admin');
    repositoryMock.findById.mockResolvedValue(null);

    const dto = {
      name: '2025-2026',
      periodType: 'semester' as const,
      breakDurationMinutes: 30,
      centerOpeningTime: '08:00',
      centerClosingTime: '22:00',
      slotDurationMinutes: 60,
    };

    expect(useCase.execute('org-1', 'year-1', 'user-1', dto)).rejects.toThrow(
      NotFoundError
    );
  });

  test('should throw NotFoundError if academic year belongs to another organization', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('admin');

    const academicYear = AcademicYear.create({
      organizationId: 'org-2',
      name: '2024-2025',
      periodType: 'semester',
      period0Start: null,
      period0End: null,
      period1Start: null,
      period1End: null,
      period2Start: null,
      period2End: null,
      breakDurationMinutes: 30,
      centerOpeningTime: '08:00',
      centerClosingTime: '22:00',
      slotDurationMinutes: 60,
    });
    repositoryMock.findById.mockResolvedValue(academicYear);

    const dto = {
      name: '2025-2026',
      periodType: 'semester' as const,
      breakDurationMinutes: 30,
      centerOpeningTime: '08:00',
      centerClosingTime: '22:00',
      slotDurationMinutes: 60,
    };

    expect(
      useCase.execute('org-1', academicYear.id, 'user-1', dto)
    ).rejects.toThrow(NotFoundError);
  });
});
