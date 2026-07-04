import type {
  SaveScheduleTimeConfigBodyDTO,
  Shift,
  UpdateScheduleTimeConfigBodyDTO,
} from '@tfg-horarios/shared';

export type NormalizedScheduleTimeConfigInput = {
  startTime: string;
  endTime: string;
  hasBreak: boolean;
  breakAfterSlot: number | null;
};

export type NormalizedScheduleTimeConfigCreateInput =
  NormalizedScheduleTimeConfigInput & {
    degreeId: string;
    itineraryId: string | null;
    courseYear: number;
    period: number;
    shift: Shift;
  };

export const normalizeCreateScheduleTimeConfigInput = (
  data: SaveScheduleTimeConfigBodyDTO
): NormalizedScheduleTimeConfigCreateInput => ({
  ...data,
  itineraryId: data.itineraryId ?? null,
  breakAfterSlot: data.breakAfterSlot ?? null,
});

export const normalizeUpdateScheduleTimeConfigInput = (
  data: UpdateScheduleTimeConfigBodyDTO
): NormalizedScheduleTimeConfigInput => ({
  ...data,
  breakAfterSlot: data.breakAfterSlot ?? null,
});
