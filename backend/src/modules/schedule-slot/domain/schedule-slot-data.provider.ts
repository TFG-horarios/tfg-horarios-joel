import type { Shift } from '@tfg-horarios/shared';

export interface IScheduleSlotContext {
  academicYearId: string;
  shift: Shift;
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
}
