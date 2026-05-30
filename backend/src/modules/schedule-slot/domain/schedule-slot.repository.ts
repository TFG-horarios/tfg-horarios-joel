import { ScheduleSlot } from './schedule-slot.entity';

export interface IScheduleSlotRepository {
  findById(id: string): Promise<ScheduleSlot | null>;
  findByScheduleId(scheduleId: string): Promise<ScheduleSlot[]>;
  create(slot: ScheduleSlot): Promise<void>;
  createMany(slots: ScheduleSlot[]): Promise<void>;
  update(slot: ScheduleSlot): Promise<void>;
  delete(id: string): Promise<void>;
}
