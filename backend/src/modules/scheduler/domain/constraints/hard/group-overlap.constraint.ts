import type {
  IScheduleConstraint,
  ConstraintContext,
  PenaltyResult,
  ConflictDetail,
} from '../constraint.interface';

export class GroupOverlapConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): PenaltyResult {
    let penalty = 0;
    const conflicts: ConflictDetail[] = [];

    for (const classesAtThisTime of context.timeSlots.values()) {
      const seenGroups = new Set<string>();
      for (const assignment of classesAtThisTime) {
        if (seenGroups.has(assignment.subjectGroupId)) {
          penalty += 1000;
          conflicts.push({
            type: 'COURSE_OVERLAP',
            subjectGroupId: assignment.subjectGroupId,
            assignmentId: assignment.id,
            message: 'Group scheduled multiple times in the same slot',
          });
        }
        seenGroups.add(assignment.subjectGroupId);
      }
    }

    return { penalty, conflicts };
  }
}
