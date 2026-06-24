import type { ScheduleSlot } from '../schedule-slot.entity';

export interface IScheduleSlotValidationProvider {
  validateMove(
    organizationId: string,
    slot: ScheduleSlot,
    newClassroomId: string | null,
    newDayOfWeek: number | null,
    newSlotIndex: number | null
  ): Promise<void>;
}
