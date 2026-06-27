import type {
  IScheduleConstraint,
  ConstraintContext,
  PenaltyResult,
  ConflictDetail,
} from '../constraint.interface';
import { intervalsOverlap } from '@tfg-horarios/shared';

export class GroupOverlapConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): PenaltyResult {
    let penalty = 0;
    const conflicts: ConflictDetail[] = [];
    const registeredPairs = new Set<string>();
    const projectedAssignments = context.projectedAssignments ?? [];

    for (let i = 0; i < projectedAssignments.length; i++) {
      for (let j = i + 1; j < projectedAssignments.length; j++) {
        const a = projectedAssignments[i]!;
        const b = projectedAssignments[j]!;
        if (
          a.dayOfWeek !== b.dayOfWeek ||
          a.assignment.subjectGroupId !== b.assignment.subjectGroupId ||
          !intervalsOverlap(a, b)
        ) {
          continue;
        }

        const pairKey = [a.assignment.id, b.assignment.id].sort().join(':');
        if (registeredPairs.has(pairKey)) continue;
        registeredPairs.add(pairKey);

        penalty += 1000;
        conflicts.push({
          type: 'COURSE_OVERLAP',
          subjectGroupId: b.assignment.subjectGroupId,
          assignmentId: b.assignment.id,
          message: 'Group scheduled multiple times in overlapping time',
        });
      }
    }

    return { penalty, conflicts };
  }
}
