import type {
  IScheduleConstraint,
  ConstraintContext,
  PenaltyResult,
  ConflictDetail,
} from '../constraint.interface';

export class ShiftConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): PenaltyResult {
    let penalty = 0;
    const conflicts: ConflictDetail[] = [];

    for (const assignment of context.assignments) {
      if (assignment.slotIndex === null) continue;

      const isMorningSlot = assignment.slotIndex < context.maxMorningSlots;
      const bleedsIntoAfternoon =
        assignment.slotIndex + Math.ceil(assignment.duration) >
        context.maxMorningSlots;
      const bleedsOutOfDay =
        assignment.slotIndex + Math.ceil(assignment.duration) >
        context.maxSlotsPerDay;

      let type: ConflictDetail['type'] | null = null;
      let message = '';

      if (assignment.shift === 'morning') {
        if (!isMorningSlot || bleedsIntoAfternoon) {
          type = 'SHIFT_MORNING';
          penalty += 1000;
          message = 'Morning shift assigned outside morning hours';
        }
      }

      if (assignment.shift === 'afternoon') {
        if (isMorningSlot) {
          type = 'SHIFT_AFTERNOON';
          penalty += 1000;
          message = 'Afternoon shift assigned in morning hours';
        } else if (bleedsOutOfDay) {
          type = 'SHIFT_EXCEEDS_DAY';
          penalty += 1000;
          message = 'Assignment bleeds out of day bounds';
        }
      }

      if (type) {
        conflicts.push({
          type,
          subjectGroupId: assignment.subjectGroupId,
          assignmentId: assignment.id,
          message,
        });
      }
    }

    return { penalty, conflicts };
  }
}
