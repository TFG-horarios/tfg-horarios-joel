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
    const labels: Record<number, string> = {};

    if (shift === 'morning' || shift === 'global') {
      const startMins = parseTime(academicYear.morningStart);
      const endMins = parseTime(academicYear.morningEnd);
      const count = Math.floor(
        (endMins - startMins) / academicYear.slotDurationMinutes
      );
      for (let i = 0; i < count; i++) {
        const slotStart = startMins + i * academicYear.slotDurationMinutes;
        const slotEnd = slotStart + academicYear.slotDurationMinutes;
        labels[i] = `${formatTime(slotStart)} - ${formatTime(slotEnd)}`;
      }
    }

    if (shift === 'afternoon' || shift === 'global') {
      const startMins = parseTime(academicYear.afternoonStart);
      const endMins = parseTime(academicYear.afternoonEnd);
      const count = Math.floor(
        (endMins - startMins) / academicYear.slotDurationMinutes
      );
      for (let i = 0; i < count; i++) {
        const slotStart = startMins + i * academicYear.slotDurationMinutes;
        const slotEnd = slotStart + academicYear.slotDurationMinutes;
        labels[maxMorningSlots + i] =
          `${formatTime(slotStart)} - ${formatTime(slotEnd)}`;
      }
    }

    return labels;
  }, [academicYear, shift, maxMorningSlots]);

  const numSlots = useMemo(() => {
    if (shift === 'morning') return maxMorningSlots;
    if (shift === 'afternoon') {
      const startMins = parseTime(academicYear.afternoonStart);
      const endMins = parseTime(academicYear.afternoonEnd);
      return Math.floor(
        (endMins - startMins) / academicYear.slotDurationMinutes
      );
    }
    const pmStart = parseTime(academicYear.afternoonStart);
    const pmEnd = parseTime(academicYear.afternoonEnd);
    return (
      maxMorningSlots +
      Math.floor((pmEnd - pmStart) / academicYear.slotDurationMinutes)
    );
  }, [academicYear, shift, maxMorningSlots]);

  return {
    startSlotIndex,
    slotTimeLabels,
    numSlots,
  };
}
