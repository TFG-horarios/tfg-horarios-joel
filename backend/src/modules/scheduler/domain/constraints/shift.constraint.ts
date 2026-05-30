import type {
  IScheduleConstraint,
  ConstraintContext,
} from './constraint.interface';

export class ShiftConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): number {
    let penalty = 0;

    for (const assignment of context.assignments) {
      if (assignment.slotIndex === null) continue;

      const isMorningSlot = assignment.slotIndex < context.maxMorningSlots;
      const bleedsIntoAfternoon =
        assignment.slotIndex + Math.ceil(assignment.duration) >
        context.maxMorningSlots;
      const bleedsOutOfDay =
        assignment.slotIndex + Math.ceil(assignment.duration) >
        context.maxSlotsPerDay;

      if (assignment.shift === 'morning') {
        if (!isMorningSlot || bleedsIntoAfternoon) penalty += 1000;
      }

      if (assignment.shift === 'afternoon') {
        if (isMorningSlot) penalty += 1000;
        if (bleedsOutOfDay) penalty += 1000;
      }
    }

    return penalty;
  }
}
