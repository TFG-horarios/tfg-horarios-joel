import type { ScheduleSlotDTO } from '@tfg-horarios/shared';
import { ScheduleSlot } from '../domain/schedule-slot.entity';

export class ScheduleSlotMapper {
  public static toDTO(slot: ScheduleSlot): ScheduleSlotDTO {
    return {
      id: slot.id,
      scheduleId: slot.scheduleId,
      subjectGroupId: slot.subjectGroupId,
      classroomId: slot.classroomId ?? null,
      dayOfWeek: slot.dayOfWeek ?? null,
      slotIndex: slot.slotIndex ?? null,
      duration: slot.duration,
      conflicts: slot.conflicts,
      createdAt: slot.createdAt.toISOString(),
      updatedAt: slot.updatedAt.toISOString(),
    };
  }
}
