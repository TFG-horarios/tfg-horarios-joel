import { describe, expect, test, mock } from 'bun:test';
import { ClassroomReservationAcademicYearAdapter } from './classroom-reservation-academic-year.adapter';

describe('ClassroomReservationAcademicYearAdapter', () => {
  const academicYearRepositoryMock = {
    findById: mock(),
    save: mock(),
    update: mock(),
    findByOrganizationId: mock(),
    findActiveByOrganizationId: mock(),
    delete: mock(),
  };

  const adapter = new ClassroomReservationAcademicYearAdapter(
    academicYearRepositoryMock
  );

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
    const ayMock = { organizationId: 'org-1', name: 'Test' };
    academicYearRepositoryMock.findById.mockResolvedValue(ayMock);
    const result = await adapter.getAcademicYear('org-1', 'year-1');
    expect(result).toEqual(ayMock);
  });
});
