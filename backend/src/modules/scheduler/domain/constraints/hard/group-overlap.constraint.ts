import type {
  IScheduleConstraint,
  ConstraintContext,
  PenaltyResult,
  ConflictDetail,
} from '../constraint.interface';
import type { ProjectedAssignment } from '../../types';
import { intervalsOverlap } from '@tfg-horarios/shared';

export class GroupOverlapConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): PenaltyResult {
    let penalty = 0;
    const conflicts: ConflictDetail[] = [];
    const registeredPairs = new Set<string>();
    const buckets =
      context.groupBuckets ??
      this.buildFallbackBuckets(context.projectedAssignments ?? []);

    for (const bucket of buckets.values()) {
      for (let i = 0; i < bucket.length; i++) {
        const a = bucket[i]!;
        for (let j = i + 1; j < bucket.length; j++) {
          const b = bucket[j]!;
          if (b.startMinutes >= a.endMinutes) break;
          if (!intervalsOverlap(a, b)) continue;

          const pairKey = [a.assignment.id, b.assignment.id]
            .sort((left, right) => left.localeCompare(right))
            .join(':');
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
    }

    return { penalty, conflicts };
  }

  private buildFallbackBuckets(
    projectedAssignments: ProjectedAssignment[]
  ): Map<string, ProjectedAssignment[]> {
    const buckets = new Map<string, ProjectedAssignment[]>();
    for (const assignment of projectedAssignments) {
      const key = `${assignment.dayOfWeek}:${assignment.assignment.subjectGroupId}`;
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.push(assignment);
      } else {
        buckets.set(key, [assignment]);
      }
    }
    for (const bucket of buckets.values()) {
      bucket.sort(
        (a, b) =>
          a.startMinutes - b.startMinutes ||
          a.endMinutes - b.endMinutes ||
          a.assignment.id.localeCompare(b.assignment.id)
      );
    }
    return buckets;
  }
}
