import type { IScheduleSlotProvider } from '../../domain/schedule-slot.provider';
import type { IScheduleSlotRepository } from '@/modules/schedule-slot/domain/schedule-slot.repository';

export class ScheduleSlotAdapter implements IScheduleSlotProvider {
  constructor(
    private readonly scheduleSlotRepository: IScheduleSlotRepository
  ) {}

  async hasUnassignedSlots(scheduleId: string): Promise<boolean> {
    const slots =
      await this.scheduleSlotRepository.findByScheduleId(scheduleId);
    return slots.some(
      (slot) => slot.dayOfWeek === null || slot.slotIndex === null
    );
  }
}
