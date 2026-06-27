export interface GlobalTimingConfig {
  slotDurationMinutes: number;
  breakDurationMinutes: number;
}

export interface LocalTimingConfig {
  startTime: string;
  endTime: string;
  hasBreak: boolean;
  breakAfterSlot: number | null;
}

export interface TimeGridSlot {
  type: 'slot';
  slotIndex: number;
  slotNumber: number;
  startMinutes: number;
  endMinutes: number;
  startTime: string;
  endTime: string;
  label: string;
}

export interface TimeGridBreak {
  type: 'break';
  afterSlot: number;
  boundaryIndex: number;
  startMinutes: number;
  endMinutes: number;
  startTime: string;
  endTime: string;
  label: string;
}

export type ScheduleTimelineRow = TimeGridSlot | TimeGridBreak;

export interface ScheduleTimeGrid {
  rows: ScheduleTimelineRow[];
  slots: TimeGridSlot[];
  breaks: TimeGridBreak[];
  breakBoundaries: number[];
}

export interface AssignmentInterval {
  startMinutes: number;
  endMinutes: number;
}

export const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
};

export const formatMinutesAsTime = (minutesTotal: number): string => {
  const hours = Math.floor(minutesTotal / 60)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor(minutesTotal % 60)
    .toString()
    .padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const buildScheduleTimeGrid = (
  globalConfig: GlobalTimingConfig,
  localConfig: LocalTimingConfig
): ScheduleTimeGrid => {
  const start = parseTimeToMinutes(localConfig.startTime);
  const end = parseTimeToMinutes(localConfig.endTime);
  const rows: ScheduleTimelineRow[] = [];
  const slots: TimeGridSlot[] = [];
  const breaks: TimeGridBreak[] = [];
  const breakBoundaries: number[] = [];
  let nextStart = start;
  let slotNumber = 1;

  while (nextStart + globalConfig.slotDurationMinutes <= end) {
    const slotEnd = nextStart + globalConfig.slotDurationMinutes;
    const startLabel = formatMinutesAsTime(nextStart);
    const endLabel = formatMinutesAsTime(slotEnd);
    const slot: TimeGridSlot = {
      type: 'slot',
      slotIndex: slotNumber - 1,
      slotNumber,
      startMinutes: nextStart,
      endMinutes: slotEnd,
      startTime: startLabel,
      endTime: endLabel,
      label: `${startLabel} - ${endLabel}`,
    };
    rows.push(slot);
    slots.push(slot);

    if (
      localConfig.hasBreak &&
      globalConfig.breakDurationMinutes > 0 &&
      slotNumber === localConfig.breakAfterSlot
    ) {
      const breakStart = slotEnd;
      const breakEnd = breakStart + globalConfig.breakDurationMinutes;
      if (breakEnd + globalConfig.slotDurationMinutes <= end) {
        const startTime = formatMinutesAsTime(breakStart);
        const endTime = formatMinutesAsTime(breakEnd);
        const longBreak: TimeGridBreak = {
          type: 'break',
          afterSlot: slotNumber,
          boundaryIndex: slotNumber,
          startMinutes: breakStart,
          endMinutes: breakEnd,
          startTime,
          endTime,
          label: `${startTime} - ${endTime}`,
        };
        rows.push(longBreak);
        breaks.push(longBreak);
        breakBoundaries.push(slotNumber);
        nextStart = breakEnd;
      } else {
        nextStart = slotEnd;
      }
    } else {
      nextStart = slotEnd;
    }

    slotNumber += 1;
  }

  return { rows, slots, breaks, breakBoundaries };
};

export const crossesBreakBoundary = (
  slotIndex: number,
  duration: number,
  breakBoundaries: readonly number[]
): boolean => {
  const endExclusive = slotIndex + Math.ceil(duration);
  return breakBoundaries.some(
    (boundary) => slotIndex < boundary && endExclusive > boundary
  );
};

export const projectAssignmentInterval = (
  grid: ScheduleTimeGrid,
  slotIndex: number,
  duration: number
): AssignmentInterval | null => {
  const span = Math.ceil(duration);
  const first = grid.slots[slotIndex];
  const last = grid.slots[slotIndex + span - 1];
  if (
    !first ||
    !last ||
    crossesBreakBoundary(slotIndex, duration, grid.breakBoundaries)
  ) {
    return null;
  }
  return { startMinutes: first.startMinutes, endMinutes: last.endMinutes };
};

export const intervalsOverlap = (
  first: AssignmentInterval,
  second: AssignmentInterval
): boolean =>
  first.startMinutes < second.endMinutes &&
  second.startMinutes < first.endMinutes;
