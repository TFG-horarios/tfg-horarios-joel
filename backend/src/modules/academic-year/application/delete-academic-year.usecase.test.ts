import { describe, expect, test, mock } from 'bun:test';
import { DeleteAcademicYearUseCase } from './delete-academic-year.usecase';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { AcademicYear } from '../domain/academic-year.entity';

describe('DeleteAcademicYearUseCase', () => {
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

  const useCase = new DeleteAcademicYearUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should delete academic year successfully', async () => {
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
    repositoryMock.delete.mockResolvedValue(undefined);

    await useCase.execute('org-1', academicYear.id, 'user-1');

    expect(repositoryMock.delete).toHaveBeenCalledWith(academicYear.id);
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('viewer');

    expect(useCase.execute('org-1', 'year-1', 'user-1')).rejects.toThrow(
      ForbiddenError
    );
  });

  test('should throw NotFoundError if academic year does not exist', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('admin');
    repositoryMock.findById.mockResolvedValue(null);

    expect(useCase.execute('org-1', 'year-1', 'user-1')).rejects.toThrow(
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

    expect(useCase.execute('org-1', academicYear.id, 'user-1')).rejects.toThrow(
      NotFoundError
    );
  });
});
