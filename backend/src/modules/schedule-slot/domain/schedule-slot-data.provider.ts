export interface IScheduleSlotContext {
  academicYearId: string;
  shift: 'morning' | 'afternoon';
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
}
