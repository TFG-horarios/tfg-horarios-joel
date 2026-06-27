import type {
  IScheduleConstraint,
  ConstraintContext,
  PenaltyResult,
  ConflictDetail,
} from '../constraint.interface';
import { intervalsOverlap } from '@tfg-horarios/shared';

export class CourseOverlapConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): PenaltyResult {
    let penalty = 0;
    const conflicts: ConflictDetail[] = [];
    const registeredConflicts = new Set<string>();

    const groupCountsPerSubjectType = new Map<string, Set<string>>();
    for (const assignment of context.assignments) {
      const key = `${assignment.subjectId}-${assignment.shift}-${assignment.groupType}`;
      if (!groupCountsPerSubjectType.has(key)) {
        groupCountsPerSubjectType.set(key, new Set());
      }
      groupCountsPerSubjectType.get(key)!.add(assignment.subjectGroupId);
    }

    const evaluatePair = (
      a: (typeof context.assignments)[number],
      b: (typeof context.assignments)[number]
    ) => {
      if (
        a.degreeId !== b.degreeId ||
        a.courseYear !== b.courseYear ||
        a.shift !== b.shift
      ) {
        return;
      }

      const conflict =
        a.isCommon || b.isCommon || a.itineraryName === b.itineraryName;

      if (!conflict) return;

      const isATheory = a.groupType === 'theory';
      const isBTheory = b.groupType === 'theory';
      const isASingleGroup =
        a.groupType !== 'theory' &&
        groupCountsPerSubjectType.get(
          `${a.subjectId}-${a.shift}-${a.groupType}`
        )?.size === 1;
      const isBSingleGroup =
        b.groupType !== 'theory' &&
        groupCountsPerSubjectType.get(
          `${b.subjectId}-${b.shift}-${b.groupType}`
        )?.size === 1;

      const addConflict = (type: ConflictDetail['type']) => {
        const pairKey = [a.id, b.id].sort().join(':');
        const conflictKey = `${type}:${pairKey}`;
        if (registeredConflicts.has(conflictKey)) return;
        registeredConflicts.add(conflictKey);

        penalty += 1000;
        conflicts.push({
          type,
          subjectGroupId: a.subjectGroupId,
          assignmentId: a.id,
          relatedSubjectGroupIds: [b.subjectGroupId],
          message: `Overlap with ${b.subjectGroupId}`,
        });
        conflicts.push({
          type,
          subjectGroupId: b.subjectGroupId,
          assignmentId: b.id,
          relatedSubjectGroupIds: [a.subjectGroupId],
          message: `Overlap with ${a.subjectGroupId}`,
        });
      };

      if (a.isCommon !== b.isCommon) {
        addConflict('COURSE_OVERLAP_COMMON_ITINERARY');
      } else if (isATheory || isBTheory) {
        addConflict('COURSE_OVERLAP_THEORY');
      } else if (isASingleGroup || isBSingleGroup) {
        addConflict('COURSE_OVERLAP_SINGLE_GROUP');
      } else if (a.groupType !== b.groupType) {
        addConflict('COURSE_OVERLAP_DIFFERENT_GROUP_TYPES');
      }

      if (a.subjectId === b.subjectId) {
        addConflict('COURSE_OVERLAP_SAME_SUBJECT');
      }
    };

    const projectedAssignments = context.projectedAssignments ?? [];
    for (let i = 0; i < projectedAssignments.length; i++) {
      for (let j = i + 1; j < projectedAssignments.length; j++) {
        const a = projectedAssignments[i]!;
        const b = projectedAssignments[j]!;
        if (a.dayOfWeek === b.dayOfWeek && intervalsOverlap(a, b)) {
          evaluatePair(a.assignment, b.assignment);
        }
      }
    }

    return { penalty, conflicts };
  }
}
