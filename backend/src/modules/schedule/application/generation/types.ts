import type { Shift } from '@tfg-horarios/shared';
import type { Schedule } from '../../domain/schedule.entity';
import type {
  CreateScheduleSlotInclusionInput,
  IScheduleRepository,
} from '../../domain/schedule.repository';
import type { ScheduleEngineAssignment } from '../../domain/providers/schedule-engine.provider';

export type PersistedScheduleItem = Omit<
  Parameters<IScheduleRepository['createSchedulesWithSlots']>[0][number],
  'inclusions'
> & {
  inclusions: NonNullable<
    Parameters<
      IScheduleRepository['createSchedulesWithSlots']
    >[0][number]['inclusions']
  >;
  baseKey: string;
  itineraryId: string | null;
};

export type ScheduleSlotInclusion = CreateScheduleSlotInclusionInput;

export type ReservationSlot = {
  classroomId: string;
  dayOfWeek: number;
  slotIndex: number;
  duration: number;
  period: number;
  timeConfigId: string;
  startTimeMinutes: number;
  endTimeMinutes: number;
};

export type PeriodGenerationResult = {
  schedulesToPersist: PersistedScheduleItem[];
  additionalInclusions: ScheduleSlotInclusion[];
  generatedSchedules: Schedule[];
  reservationSlots: ReservationSlot[];
};

export type ScheduleScopeData = {
  degreeId: string;
  itineraryId: string | null;
  courseYear: number;
  shift: Shift;
  assignments: ScheduleEngineAssignment[];
};

export const emptyPeriodResult = (): PeriodGenerationResult => ({
  schedulesToPersist: [],
  additionalInclusions: [],
  generatedSchedules: [],
  reservationSlots: [],
});
