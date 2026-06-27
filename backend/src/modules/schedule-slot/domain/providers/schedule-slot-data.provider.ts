import type { Shift } from '@tfg-horarios/shared';

export interface IScheduleSlotContext {
  academicYearId: string;
  period: number;
  shift: Shift;
  timeConfigId: string | null;
}

export interface IScheduleSlotDataProvider {
  getScheduleContext(
    scheduleId: string,
    organizationId: string
  ): Promise<IScheduleSlotContext | null>;
  isGroupCommon(
    subjectGroupId: string,
    scheduleId: string,
    organizationId: string
  ): Promise<boolean>;
  unpublishSchedule(scheduleId: string, organizationId: string): Promise<void>;
  rejectConflictingReservations(
    organizationId: string,
    academicYearId: string,
    period: number,
    classroomId: string,
    dayOfWeek: number,
    slotIndex: number,
    duration: number,
    timeConfigId?: string | null
  ): Promise<void>;
  updateScheduleConflictsAndUnassignedCount(
    scheduleId: string,
    organizationId: string
  ): Promise<void>;
}
