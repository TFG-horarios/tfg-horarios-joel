import type {
  IScheduleConstraint,
  ConstraintContext,
  PenaltyResult,
  ConflictDetail,
} from '../constraint.interface';
import type { ProjectedAssignment } from '../../types';
import { intervalsOverlap } from '@tfg-horarios/shared';

export class RoomOverlapConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): PenaltyResult {
    let penalty = 0;
    const conflicts: ConflictDetail[] = [];
    const registeredPairs = new Set<string>();
    const buckets =
      context.roomBuckets ??
      this.buildFallbackBuckets(context.projectedAssignments ?? []);

    for (const bucket of buckets.values()) {
      for (let i = 0; i < bucket.length; i++) {
        const a = bucket[i]!;
        for (let j = i + 1; j < bucket.length; j++) {
          const b = bucket[j]!;
          if (b.startMinutes >= a.endMinutes) break;
          if (!intervalsOverlap(a, b)) continue;

          const pairKey = [a.assignment.id, b.assignment.id].sort().join(':');
          if (registeredPairs.has(pairKey)) continue;
          registeredPairs.add(pairKey);

          penalty += 1000;
          conflicts.push({
            type: 'ROOM_OVERLAP',
            subjectGroupId: a.assignment.subjectGroupId,
            assignmentId: a.assignment.id,
            relatedSubjectGroupIds: [b.assignment.subjectGroupId],
            classroomId: a.assignment.classroomId ?? undefined,
          });
          conflicts.push({
            type: 'ROOM_OVERLAP',
            subjectGroupId: b.assignment.subjectGroupId,
            assignmentId: b.assignment.id,
            relatedSubjectGroupIds: [a.assignment.subjectGroupId],
            classroomId: a.assignment.classroomId ?? undefined,
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
      if (!assignment.assignment.classroomId) continue;
      const key = `${assignment.dayOfWeek}:${assignment.assignment.classroomId}`;
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
