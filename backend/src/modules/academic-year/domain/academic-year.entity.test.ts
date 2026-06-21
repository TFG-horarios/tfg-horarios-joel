import { describe, expect, test } from 'bun:test';
import { AcademicYear } from './academic-year.entity';

describe('AcademicYear', () => {
  test('creates an academic year successfully', () => {
    const year = AcademicYear.create({
      organizationId: 'org-1',
      name: '2024-2025',
      periodType: 'semester',
      morningStart: '08:00',
      morningEnd: '14:00',
      afternoonStart: '15:00',
      afternoonEnd: '21:00',
      slotDurationMinutes: 60,
      period0Start: '2024-09-01',
      period0End: '2025-06-30',
      period1Start: null,
      period1End: null,
      period2Start: null,
      period2End: null,
    });

    expect(year.id).toBeDefined();
    expect(year.organizationId).toBe('org-1');
    expect(year.name).toBe('2024-2025');
    expect(year.createdAt).toBeDefined();
    expect(year.updatedAt).toBeDefined();
  });

  test('reconstitutes an academic year from persisted props', () => {
    const props = {
      id: 'year-1',
      organizationId: 'org-1',
      name: '2024-2025',
      period0Start: '2024-09-01',
      period0End: '2025-06-30',
      period1Start: null,
      period1End: null,
      period2Start: null,
      period2End: null,
      periodType: 'semester' as const,
      morningStart: '08:00',
      morningEnd: '14:00',
      afternoonStart: '15:00',
      afternoonEnd: '21:00',
      slotDurationMinutes: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const year = AcademicYear.reconstitute(props);
    expect(year.id).toBe('year-1');
  });

  test('updates academic year data and refreshes updatedAt', () => {
    const year = AcademicYear.create({
      organizationId: 'org-1',
      name: '2024-2025',
      periodType: 'semester',
      morningStart: '08:00',
      morningEnd: '14:00',
      afternoonStart: '15:00',
      afternoonEnd: '21:00',
      slotDurationMinutes: 60,
      period0Start: '2024-09-01',
      period0End: '2025-06-30',
      period1Start: null,
      period1End: null,
      period2Start: null,
      period2End: null,
    });

    const oldUpdatedAt = year.updatedAt;

    year.update({
      name: '2025-2026',
      period0Start: '2025-09-01',
      period0End: '2026-06-30',
      period1Start: '2025-09-01',
      period1End: '2026-01-31',
      period2Start: '2026-02-01',
      period2End: '2026-06-30',
      periodType: 'semester',
      morningStart: '09:00',
      morningEnd: '15:00',
      afternoonStart: '16:00',
      afternoonEnd: '22:00',
      slotDurationMinutes: 45,
    });

    expect(year.name).toBe('2025-2026');
    expect(year.period0Start).toBe('2025-09-01');
    expect(year.period0End).toBe('2026-06-30');
    expect(year.period1Start).toBe('2025-09-01');
    expect(year.period1End).toBe('2026-01-31');
    expect(year.period2Start).toBe('2026-02-01');
    expect(year.period2End).toBe('2026-06-30');
    expect(year.periodType).toBe('semester');
    expect(year.morningStart).toBe('09:00');
    expect(year.morningEnd).toBe('15:00');
    expect(year.afternoonStart).toBe('16:00');
    expect(year.afternoonEnd).toBe('22:00');
    expect(year.slotDurationMinutes).toBe(45);
    expect(year.updatedAt.getTime()).toBeGreaterThanOrEqual(
      oldUpdatedAt.getTime()
    );
  });

  test('getMatchingPeriods returns correct periods', () => {
    const year = AcademicYear.create({
      organizationId: 'org-1',
      name: '2024-2025',
      periodType: 'semester',
      morningStart: '08:00',
      morningEnd: '14:00',
      afternoonStart: '15:00',
      afternoonEnd: '21:00',
      slotDurationMinutes: 60,
      period0Start: '2024-09-01',
      period0End: '2025-06-30',
      period1Start: '2024-09-01',
      period1End: '2025-01-31',
      period2Start: '2025-02-01',
      period2End: '2025-06-30',
    });

    const dateInPeriod1 = new Date('2024-10-15T12:00:00Z');
    const matching1 = year.getMatchingPeriods(dateInPeriod1);
    expect(matching1).toContain(1);
    expect(matching1).toContain(2);

    const dateInPeriod2 = new Date('2025-03-15T12:00:00Z');
    const matching2 = year.getMatchingPeriods(dateInPeriod2);
    expect(matching2).toContain(1);
    expect(matching2).toContain(3);

    const dateOut = new Date('2023-01-01T12:00:00Z');
    const matching3 = year.getMatchingPeriods(dateOut);
    expect(matching3.length).toBe(0);
  });
});
