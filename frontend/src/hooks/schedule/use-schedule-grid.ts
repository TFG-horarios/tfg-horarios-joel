import { useMemo } from 'react';
import type { OrganizationDTO } from '@tfg-horarios/shared';

export function useScheduleGrid(
  organization: OrganizationDTO,
  shift: 'morning' | 'afternoon' | 'global' | string
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

  const slotTimeLabels = useMemo(() => {
    let startMins;
    let endMins;

    if (shift === 'morning') {
      startMins = parseTime(organization.morningStart);
      endMins = parseTime(organization.morningEnd);
    } else if (shift === 'afternoon') {
      startMins = parseTime(organization.afternoonStart);
      endMins = parseTime(organization.afternoonEnd);
    } else {
      startMins = parseTime(organization.morningStart);
      endMins = parseTime(organization.afternoonEnd);
    }

    const count = Math.floor(
      (endMins - startMins) / organization.slotDurationMinutes
    );
    const labels: Record<number, string> = {};

    for (let i = 0; i < count; i++) {
      const slotStart = startMins + i * organization.slotDurationMinutes;
      const slotEnd = slotStart + organization.slotDurationMinutes;
      labels[i] = `${formatTime(slotStart)} - ${formatTime(slotEnd)}`;
    }
    return labels;
  }, [organization, shift]);

  const numSlots = Object.keys(slotTimeLabels).length;

  return {
    slotTimeLabels,
    numSlots,
  };
}
