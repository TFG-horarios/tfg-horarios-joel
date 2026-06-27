import type {
  IScheduleConstraint,
  ConstraintContext,
  PenaltyResult,
  ConflictDetail,
} from '../constraint.interface';
import { intervalsOverlap } from '@tfg-horarios/shared';

export class RoomOverlapConstraint implements IScheduleConstraint {
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
          !a.assignment.classroomId ||
          a.assignment.classroomId !== b.assignment.classroomId ||
          !intervalsOverlap(a, b)
        ) {
          continue;
        }

        const pairKey = [a.assignment.id, b.assignment.id].sort().join(':');
        if (registeredPairs.has(pairKey)) continue;
        registeredPairs.add(pairKey);

        penalty += 1000;
        conflicts.push({
          type: 'ROOM_OVERLAP',
          subjectGroupId: a.assignment.subjectGroupId,
          assignmentId: a.assignment.id,
          relatedSubjectGroupIds: [b.assignment.subjectGroupId],
          classroomId: a.assignment.classroomId,
        });
        conflicts.push({
          type: 'ROOM_OVERLAP',
          subjectGroupId: b.assignment.subjectGroupId,
          assignmentId: b.assignment.id,
          relatedSubjectGroupIds: [a.assignment.subjectGroupId],
          classroomId: a.assignment.classroomId,
        });
      }
    }

    return { penalty, conflicts };
  }
}
