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
    const registeredPairs = new Set<string>();

    for (const classesAtThisTime of context.timeSlots.values()) {
      const seenGroups = new Map<string, (typeof classesAtThisTime)[number]>();
      for (const assignment of classesAtThisTime) {
        const existingAssignment = seenGroups.get(assignment.subjectGroupId);
        if (existingAssignment) {
          const pairKey = [existingAssignment.id, assignment.id]
            .sort()
            .join(':');
          if (registeredPairs.has(pairKey)) continue;
          registeredPairs.add(pairKey);

          penalty += 1000;
          conflicts.push({
            type: 'COURSE_OVERLAP',
            subjectGroupId: assignment.subjectGroupId,
            assignmentId: assignment.id,
            message: 'Group scheduled multiple times in the same slot',
          });
        }
        seenGroups.set(assignment.subjectGroupId, assignment);
      }
    }

    return { penalty, conflicts };
  }
}
