import { useMemo } from 'react';
import {
  buildScheduleTimeGrid,
  type AcademicYearDTO,
  type ScheduleTimeConfigDTO,
  type Shift,
} from '@tfg-horarios/shared';

export function useScheduleGrid(
  academicYear: AcademicYearDTO,
  shift: Shift | 'global' | string,
  timeConfig?: Pick<
    ScheduleTimeConfigDTO,
    'startTime' | 'endTime' | 'hasBreak' | 'breakAfterSlot'
  > | null
) {
  const grid = useMemo(
    () =>
      buildScheduleTimeGrid(
        {
          slotDurationMinutes: academicYear.slotDurationMinutes,
          breakDurationMinutes: academicYear.breakDurationMinutes,
        },
        timeConfig ?? {
          startTime: academicYear.centerOpeningTime,
          endTime: academicYear.centerClosingTime,
          hasBreak: false,
          breakAfterSlot: null,
        }
      ),
    [academicYear, timeConfig]
  );

  const startSlotIndex = 0;

  const slotTimeLabels = useMemo(() => {
    const labels: Record<number, string> = {};
    grid.slots.forEach((slot) => {
      labels[slot.slotIndex] = slot.label;
    });
    return labels;
  }, [grid]);

  const numSlots = grid.slots.length;

  return {
    startSlotIndex,
    slotTimeLabels,
    numSlots,
    rows: grid.rows,
    slots: grid.slots,
  };
}
