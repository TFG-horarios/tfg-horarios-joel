import type { ScheduleConflictDetailDTO } from '@tfg-horarios/shared';
import { intervalsOverlap } from '@tfg-horarios/shared';
import { ScheduleSlotConflictError } from '../schedule-slot-conflict.error';
import type {
  IMoveValidationRule,
  MoveValidationContext,
} from './move-validation';

export class CourseGroupOverlapRule implements IMoveValidationRule {
  validate(context: MoveValidationContext): void {
    const conflicts = new Map<string, ScheduleConflictDetailDTO>();
    const groupCountsPerSubjectType = new Map<string, Set<string>>();
    for (const assignment of context.assignments) {
      const key = `${assignment.subjectId}-${assignment.shift}-${assignment.groupType}`;
      if (!groupCountsPerSubjectType.has(key)) {
        groupCountsPerSubjectType.set(key, new Set());
      }
      groupCountsPerSubjectType.get(key)!.add(assignment.subjectGroupId);
    }

    if (context.newDayOfWeek !== null && context.newSlotIndex !== null) {
      if (!context.projectIntervalForPlacement) return;

      const movingInterval =
        context.movingInterval ??
        context.projectIntervalForPlacement(
          context.movingAssignment.timeConfigId,
          context.newSlotIndex,
          context.movingAssignment.duration
        );
      if (!movingInterval) return;

      for (const other of context.assignments) {
        if (other.id === context.movingAssignment.id) continue;
        if (other.dayOfWeek !== context.newDayOfWeek) continue;

        const otherInterval = context.projectIntervalForPlacement(
          other.timeConfigId,
          other.slotIndex,
          other.duration
        );
        if (
          !otherInterval ||
          !intervalsOverlap(movingInterval, otherInterval)
        ) {
          continue;
        }

        const conflict =
          context.movingAssignment.isCommon ||
          other.isCommon ||
          context.movingAssignment.itineraryName === other.itineraryName;

        if (conflict) {
          const isATheory = context.movingAssignment.groupType === 'theory';
          const isBTheory = other.groupType === 'theory';

          const isASingleGroup =
            context.movingAssignment.groupType !== 'theory' &&
            groupCountsPerSubjectType.get(
              `${context.movingAssignment.subjectId}-${context.movingAssignment.shift}-${context.movingAssignment.groupType}`
            )?.size === 1;
          const isBSingleGroup =
            other.groupType !== 'theory' &&
            groupCountsPerSubjectType.get(
              `${other.subjectId}-${other.shift}-${other.groupType}`
            )?.size === 1;

          const addConflict = (
            type: ScheduleConflictDetailDTO['type'],
            message: string
          ) => {
            conflicts.set(`${type}:${other.id}`, {
              type,
              message,
              subjectGroupId: context.movingAssignment.subjectGroupId,
              assignmentId: context.movingAssignment.id,
              relatedSubjectGroupIds: [other.subjectGroupId],
            });
          };

          if (context.movingAssignment.isCommon !== other.isCommon) {
            addConflict(
              'COURSE_OVERLAP_COMMON_ITINERARY',
              'ERR_OVERLAP_COMMON_ITINERARY'
            );
          } else if (isATheory || isBTheory) {
            addConflict('COURSE_OVERLAP_THEORY', 'ERR_OVERLAP_THEORY');
          } else if (isASingleGroup || isBSingleGroup) {
            addConflict(
              'COURSE_OVERLAP_SINGLE_GROUP',
              'ERR_OVERLAP_SINGLE_GROUP'
            );
          } else if (context.movingAssignment.groupType !== other.groupType) {
            addConflict(
              'COURSE_OVERLAP_DIFFERENT_GROUP_TYPES',
              'ERR_OVERLAP_DIFFERENT_GROUP_TYPES'
            );
          }

          if (context.movingAssignment.subjectId === other.subjectId) {
            addConflict(
              'COURSE_OVERLAP_SAME_SUBJECT',
              'ERR_OVERLAP_SAME_SUBJECT'
            );
          }
        }
      }
    }

    if (conflicts.size > 0) {
      throw new ScheduleSlotConflictError([...conflicts.values()]);
    }
  }
}
