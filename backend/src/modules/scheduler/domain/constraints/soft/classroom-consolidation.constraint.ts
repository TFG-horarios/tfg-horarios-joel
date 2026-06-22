import type {
  IScheduleConstraint,
  ConstraintContext,
  PenaltyResult,
} from '../constraint.interface';

export class ClassroomConsolidationConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): PenaltyResult {
    const usedClassrooms = new Set<string>();

    for (const assignment of context.assignments) {
      if (assignment.classroomId) {
        usedClassrooms.add(assignment.classroomId);
      }
    }

    const penalty = usedClassrooms.size * 20;

    return { penalty, conflicts: [] };
  }
}
