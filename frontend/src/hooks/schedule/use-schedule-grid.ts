import { useMemo } from 'react';
import type { AcademicYearDTO, Shift } from '@tfg-horarios/shared';

export function useScheduleGrid(
  academicYear: AcademicYearDTO,
  shift: Shift | 'global' | string
) {
  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  };

  const formatTime = (minutesTotal: number) => {
    const h = Math.floor(minutesTotal / 60)
      .toString()
      .padStart(2, '0');
    const m = Math.floor(minutesTotal % 60)
      .toString()
      .padStart(2, '0');
    return `${h}:${m}`;
  };

  const maxMorningSlots = useMemo(() => {
    const morningStart = parseTime(academicYear.morningStart);
    const morningEnd = parseTime(academicYear.morningEnd);
    return Math.floor(
      (morningEnd - morningStart) / academicYear.slotDurationMinutes
    );
  }, [academicYear]);

  const startSlotIndex = useMemo(() => {
    if (shift === 'afternoon') {
      return maxMorningSlots;
    }
    return 0;
  }, [shift, maxMorningSlots]);

  const slotTimeLabels = useMemo(() => {
    let startMins;
    let endMins;

    if (shift === 'morning') {
      startMins = parseTime(academicYear.morningStart);
      endMins = parseTime(academicYear.morningEnd);
    } else if (shift === 'afternoon') {
      startMins = parseTime(academicYear.afternoonStart);
      endMins = parseTime(academicYear.afternoonEnd);
    } else {
      startMins = parseTime(academicYear.morningStart);
      endMins = parseTime(academicYear.afternoonEnd);
    }

    const count = Math.floor(
      (endMins - startMins) / academicYear.slotDurationMinutes
    );
    const labels: Record<number, string> = {};

    for (let i = 0; i < count; i++) {
      const slotStart = startMins + i * academicYear.slotDurationMinutes;
      const slotEnd = slotStart + academicYear.slotDurationMinutes;
      labels[startSlotIndex + i] =
        `${formatTime(slotStart)} - ${formatTime(slotEnd)}`;
    }
    return labels;
  }, [academicYear, shift, startSlotIndex]);

  const numSlots = Object.keys(slotTimeLabels).length;

  return {
    startSlotIndex,
    slotTimeLabels,
    numSlots,
  };
}
