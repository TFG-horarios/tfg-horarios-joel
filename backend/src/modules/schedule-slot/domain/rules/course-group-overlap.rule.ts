import { ConflictError } from '@/core/errors/app.error';
import type {
  IMoveValidationRule,
  MoveValidationContext,
} from './move-validation';

export class CourseGroupOverlapRule implements IMoveValidationRule {
  validate(context: MoveValidationContext): void {
    const errors = new Set<string>();
    const groupCountsPerSubjectType = new Map<string, Set<string>>();
    for (const assignment of context.assignments) {
      const key = `${assignment.subjectId}-${assignment.shift}-${assignment.groupType}`;
      if (!groupCountsPerSubjectType.has(key)) {
        groupCountsPerSubjectType.set(key, new Set());
      }
      groupCountsPerSubjectType.get(key)!.add(assignment.subjectGroupId);
    }

    if (context.newDayOfWeek !== null && context.newSlotIndex !== null) {
      const movingDurationSlots = Math.ceil(context.movingAssignment.duration);
      const newStart = context.newSlotIndex;
      const newEnd = context.newSlotIndex + movingDurationSlots - 1;

      for (const other of context.assignments) {
        if (other.id === context.movingAssignment.id) continue;
        if (other.dayOfWeek !== context.newDayOfWeek) continue;
        if (other.slotIndex === null) continue;

        const otherStart = other.slotIndex;
        const otherEnd = other.slotIndex + Math.ceil(other.duration) - 1;

        if (newStart <= otherEnd && newEnd >= otherStart) {
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

            if (context.movingAssignment.isCommon !== other.isCommon) {
              errors.add('ERR_OVERLAP_COMMON_ITINERARY');
            } else if (isATheory || isBTheory) {
              errors.add('ERR_OVERLAP_THEORY');
            } else if (isASingleGroup || isBSingleGroup) {
              errors.add('ERR_OVERLAP_SINGLE_GROUP');
            } else if (context.movingAssignment.groupType !== other.groupType) {
              errors.add('ERR_OVERLAP_DIFFERENT_GROUP_TYPES');
            }

            if (context.movingAssignment.subjectId === other.subjectId) {
              errors.add('ERR_OVERLAP_SAME_SUBJECT');
            }
          }
        }
      }
    }

    if (errors.size > 0) {
      throw new ConflictError([...errors].join('\n'));
    }
  }
}
