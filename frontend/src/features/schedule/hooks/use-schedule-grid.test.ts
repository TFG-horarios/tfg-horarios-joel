import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildAcademicYear } from '@/test/builders';
import { useScheduleGrid } from './use-schedule-grid';

describe('useScheduleGrid', () => {
  it('builds slot labels from the academic year default time range', () => {
    const { result } = renderHook(() =>
      useScheduleGrid(
        buildAcademicYear({
          centerOpeningTime: '08:00',
          centerClosingTime: '10:00',
          slotDurationMinutes: 60,
          breakDurationMinutes: 15,
        })
      )
    );

    expect(result.current.startSlotIndex).toBe(0);
    expect(result.current.numSlots).toBeGreaterThan(0);
    expect(result.current.slotTimeLabels[0]).toContain('08:00');
  });

  it('uses an explicit time config when provided', () => {
    const { result } = renderHook(() =>
      useScheduleGrid(buildAcademicYear(), {
        startTime: '09:00',
        endTime: '11:00',
        hasBreak: false,
        breakAfterSlot: null,
      })
    );

    expect(result.current.slotTimeLabels[0]).toContain('09:00');
  });
});
