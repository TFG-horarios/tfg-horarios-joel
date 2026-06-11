import { describe, expect, test } from 'bun:test';
import { AcademicYearMapper } from './academic-year.mapper';
import { AcademicYear } from '../domain/academic-year.entity';

describe('AcademicYearMapper', () => {
  const dummyDate = new Date('2024-01-01T10:00:00Z');

  const dummyAcademicYear = AcademicYear.reconstitute({
    id: 'ay-1',
    organizationId: 'org-1',
    name: '2025-2026',
    period0Start: '2025-09-01',
    period0End: '2026-06-30',
    period1Start: '2024-09-01',
    period1End: '2025-01-31',
    period2Start: null,
    period2End: null,
    period3Start: null,
    period3End: null,
    createdAt: dummyDate,
    updatedAt: dummyDate,
  });

  test('should map AcademicYear to AcademicYearDTO', () => {
    const dto = AcademicYearMapper.toDTO(dummyAcademicYear);
    expect(dto).toEqual({
      id: 'ay-1',
      organizationId: 'org-1',
      name: '2025-2026',
      isActive: true,
      period0Start: '2025-09-01',
      period0End: '2026-06-30',
      period1Start: '2024-09-01',
      period1End: '2025-01-31',
      period2Start: null,
      period2End: null,
      period3Start: null,
      period3End: null,
      createdAt: '2024-01-01T10:00:00.000Z',
      updatedAt: '2024-01-01T10:00:00.000Z',
    });
  });

  test('should map list of AcademicYear to list of AcademicYearDTO', () => {
    const dtoList = AcademicYearMapper.toDTOList([dummyAcademicYear]);
    expect(dtoList.length).toBe(1);
    expect(dtoList[0]?.id).toBe('ay-1');
  });
});
