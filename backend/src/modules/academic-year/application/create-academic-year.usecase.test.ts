import { describe, expect, test, mock } from 'bun:test';
import { CreateAcademicYearUseCase } from './create-academic-year.usecase';
import {
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from '@/core/errors/app.error';
import { AcademicYear } from '../domain/academic-year.entity';

describe('CreateAcademicYearUseCase', () => {
  const repositoryMock = {
    save: mock(),
    findById: mock(),
    findByOrganizationId: mock(),
    delete: mock(),
    update: mock(),
    findActiveByOrganizationId: mock(),
  };

  const organizationProviderMock = {
    organizationExists: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const useCase = new CreateAcademicYearUseCase(
    repositoryMock,
    organizationProviderMock,
    memberProviderMock
  );

  test('should create an academic year successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('admin');
    organizationProviderMock.organizationExists.mockResolvedValue(true);
    repositoryMock.findByOrganizationId.mockResolvedValue([]);
    repositoryMock.save.mockResolvedValue(undefined);

    const dto = {
      name: '2024-2025',
      periodType: 'semester' as const,
      morningStart: '08:00',
      morningEnd: '14:00',
      afternoonStart: '15:00',
      afternoonEnd: '21:00',
      slotDurationMinutes: 60,
    };

    const result = await useCase.execute('org-1', 'user-1', dto);

    expect(result.name).toBe('2024-2025');
    expect(repositoryMock.save).toHaveBeenCalled();
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('VIEWER');

    const dto = {
      name: '2024-2025',
      periodType: 'semester' as const,
      morningStart: '08:00',
      morningEnd: '14:00',
      afternoonStart: '15:00',
      afternoonEnd: '21:00',
      slotDurationMinutes: 60,
    };

    expect(useCase.execute('org-1', 'user-1', dto)).rejects.toThrow(
      ForbiddenError
    );
  });

  test('should throw NotFoundError if organization does not exist', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('admin');
    organizationProviderMock.organizationExists.mockResolvedValue(false);

    const dto = {
      name: '2024-2025',
      periodType: 'semester' as const,
      morningStart: '08:00',
      morningEnd: '14:00',
      afternoonStart: '15:00',
      afternoonEnd: '21:00',
      slotDurationMinutes: 60,
    };

    expect(useCase.execute('org-1', 'user-1', dto)).rejects.toThrow(
      NotFoundError
    );
  });

  test('should throw ConflictError if academic year name already exists', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('admin');
    organizationProviderMock.organizationExists.mockResolvedValue(true);

    const existingYear = AcademicYear.create({
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
    repositoryMock.findByOrganizationId.mockResolvedValue([existingYear]);

    const dto = {
      name: '2024-2025',
      periodType: 'semester' as const,
      morningStart: '08:00',
      morningEnd: '14:00',
      afternoonStart: '15:00',
      afternoonEnd: '21:00',
      slotDurationMinutes: 60,
    };

    expect(useCase.execute('org-1', 'user-1', dto)).rejects.toThrow(
      ConflictError
    );
  });
});
