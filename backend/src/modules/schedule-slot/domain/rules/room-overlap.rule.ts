import type { ScheduleConflictDetailDTO } from '@tfg-horarios/shared';
import { ScheduleSlotConflictError } from '../schedule-slot-conflict.error';
import type {
  IMoveValidationRule,
  MoveValidationContext,
} from './move-validation';
import type { IScheduleSlotRepository } from '../schedule-slot.repository';

export class RoomOverlapRule implements IMoveValidationRule {
  constructor(
    private readonly scheduleSlotRepository: IScheduleSlotRepository
  ) {}

  async validate(context: MoveValidationContext): Promise<void> {
    if (
      context.newClassroomId !== null &&
      context.newDayOfWeek !== null &&
      context.newSlotIndex !== null
    ) {
      const classroomSlots =
        await this.scheduleSlotRepository.findSlotsByClassroomIdAndFilters(
          context.newClassroomId,
          context.organizationId,
          {
            academicYearId: context.academicYearId,
            period: context.period,
            shift: context.shift,
          }
        );

      const movingDurationSlots = Math.ceil(context.movingAssignment.duration);
      const newStart = context.newSlotIndex;
      const newEnd = context.newSlotIndex + movingDurationSlots - 1;

      const conflicts: ScheduleConflictDetailDTO[] = [];
      for (const existingSlot of classroomSlots) {
        if (existingSlot.id === context.movingAssignment.id) continue;
        if (existingSlot.dayOfWeek !== context.newDayOfWeek) continue;
        if (existingSlot.slotIndex === null) continue;

        const existingStart = existingSlot.slotIndex;
        const existingEnd =
          existingSlot.slotIndex + Math.ceil(existingSlot.duration) - 1;

        if (newStart <= existingEnd && newEnd >= existingStart) {
          conflicts.push({
            type: 'ROOM_OVERLAP',
            message: 'ERR_ROOM_OVERLAP',
            subjectGroupId: context.movingAssignment.subjectGroupId,
            assignmentId: context.movingAssignment.id,
            relatedSubjectGroupIds: [existingSlot.subjectGroupId],
            classroomId: context.newClassroomId,
          });
        }
      }
      if (conflicts.length > 0) {
        throw new ScheduleSlotConflictError(conflicts);
      }
    }
  }
}
