import type { IScheduleSlotProvider } from '../../domain/schedule-slot.provider';
import type { IScheduleSlotRepository } from '@/modules/schedule-slot/domain/schedule-slot.repository';
import { isUnassignedPlacement } from '@/modules/schedule-slot/domain/schedule-issues';

export class ScheduleSlotAdapter implements IScheduleSlotProvider {
  constructor(
    private readonly scheduleSlotRepository: IScheduleSlotRepository
  ) {}

  async hasUnassignedSlots(scheduleId: string): Promise<boolean> {
    const slots =
      await this.scheduleSlotRepository.findByScheduleId(scheduleId);
    return slots.some(isUnassignedPlacement);
  }
}
