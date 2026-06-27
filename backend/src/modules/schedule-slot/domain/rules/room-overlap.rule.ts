import {
  intervalsOverlap,
  type ScheduleConflictDetailDTO,
} from '@tfg-horarios/shared';
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
          }
        );

      if (
        !context.projectIntervalForPlacement ||
        !context.resolveScheduleTimeConfigId
      ) {
        return;
      }

      const movingInterval = context.projectIntervalForPlacement(
        context.movingAssignment.timeConfigId,
        context.newSlotIndex,
        context.movingAssignment.duration
      );
      if (!movingInterval) return;

      const conflicts: ScheduleConflictDetailDTO[] = [];
      for (const existingSlot of classroomSlots) {
        if (existingSlot.id === context.movingAssignment.id) continue;
        if (existingSlot.dayOfWeek !== context.newDayOfWeek) continue;
        if (existingSlot.slotIndex === null) continue;

        const existingTimeConfigId = await context.resolveScheduleTimeConfigId(
          existingSlot.scheduleId
        );
        const existingInterval = context.projectIntervalForPlacement(
          existingTimeConfigId,
          existingSlot.slotIndex,
          existingSlot.duration
        );
        const overlaps = Boolean(
          existingInterval && intervalsOverlap(movingInterval, existingInterval)
        );

        if (overlaps) {
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
