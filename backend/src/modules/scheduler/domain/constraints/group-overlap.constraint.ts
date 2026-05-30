import type {
  IScheduleConstraint,
  ConstraintContext,
} from './constraint.interface';

export class GroupOverlapConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): number {
    let penalty = 0;

    for (const classesAtThisTime of context.timeSlots.values()) {
      const seenGroups = new Set<string>();
      for (const assignment of classesAtThisTime) {
        if (seenGroups.has(assignment.subjectGroupId)) {
          penalty += 1000;
        }
        seenGroups.add(assignment.subjectGroupId);
      }
    }

    return penalty;
  }
}
