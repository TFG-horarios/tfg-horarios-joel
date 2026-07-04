import { describe, expect, test, mock } from 'bun:test';
import type { ReservationAcademicYear } from '../../domain/providers/academic-year.provider';
import { AcademicYearAdapter } from './academic-year.adapter';

describe('AcademicYearAdapter', () => {
  const createAcademicYear = (
    organizationId = 'org-1'
  ): ReservationAcademicYear => ({
    organizationId,
    period0Start: '2026-09-01',
    period0End: '2027-06-30',
    period1Start: null,
    period1End: null,
    period2Start: null,
    period2End: null,
    centerOpeningTime: '08:00',
    centerClosingTime: '21:00',
    slotDurationMinutes: 60,
    getMatchingPeriods: mock().mockReturnValue([0]),
  });

  const academicYearRepositoryMock = {
    findById: mock(),
    save: mock(),
    update: mock(),
    findByOrganizationId: mock(),
    delete: mock(),
  };

  const adapter = new AcademicYearAdapter(academicYearRepositoryMock);

  test('getMatchingPeriods should return null if academic year not found', async () => {
    academicYearRepositoryMock.findById.mockResolvedValue(null);
    const result = await adapter.getMatchingPeriods(
      'org-1',
      'year-1',
      new Date()
    );
    expect(result).toBeNull();
  });

  test('getMatchingPeriods should return null if org does not match', async () => {
    academicYearRepositoryMock.findById.mockResolvedValue({
      organizationId: 'org-2',
    });
    const result = await adapter.getMatchingPeriods(
      'org-1',
      'year-1',
      new Date()
    );
    expect(result).toBeNull();
  });

  test('getMatchingPeriods should return periods from academic year', async () => {
    const ayMock = {
      organizationId: 'org-1',
      getMatchingPeriods: mock().mockReturnValue([1, 2]),
    };
    academicYearRepositoryMock.findById.mockResolvedValue(ayMock);
    const result = await adapter.getMatchingPeriods(
      'org-1',
      'year-1',
      new Date()
    );
    expect(result).toEqual([1, 2]);
  });

  test('getAcademicYear should return null if not found', async () => {
    academicYearRepositoryMock.findById.mockResolvedValue(null);
    const result = await adapter.getAcademicYear('org-1', 'year-1');
    expect(result).toBeNull();
  });

  test('getAcademicYear should return null if org does not match', async () => {
    academicYearRepositoryMock.findById.mockResolvedValue({
      organizationId: 'org-2',
    });
    const result = await adapter.getAcademicYear('org-1', 'year-1');
    expect(result).toBeNull();
  });

  test('getAcademicYear should return academic year', async () => {
    const ayMock = createAcademicYear();
    academicYearRepositoryMock.findById.mockResolvedValue(ayMock);
    const result = await adapter.getAcademicYear('org-1', 'year-1');
    expect(result).toEqual(ayMock);
  });
});
