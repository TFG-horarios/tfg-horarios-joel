export interface IScheduleSlotProvider {
  hasUnassignedSlots(scheduleId: string): Promise<boolean>;
}
