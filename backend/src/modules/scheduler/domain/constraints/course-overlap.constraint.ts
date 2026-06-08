import type {
  IScheduleConstraint,
  ConstraintContext,
} from './constraint.interface';

export class CourseOverlapConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): number {
    let penalty = 0;

    for (const timeSlotsForDegree of context.degreeGroups.values()) {
      for (const classesAtThisTime of timeSlotsForDegree.values()) {
        if (classesAtThisTime.length <= 1) {
          continue;
        }

        const hasTheory = classesAtThisTime.some(
          (a) => a.groupType === 'theory'
        );

        if (hasTheory) {
          // Rule 1: Theory cannot overlap with anything.
          penalty += 1000 * (classesAtThisTime.length - 1);
        } else {
          const hasPractices = classesAtThisTime.some(
            (a) => a.groupType === 'practices'
          );
          const hasProblems = classesAtThisTime.some(
            (a) => a.groupType === 'problems'
          );

          // Rule 2: Practices and Problems cannot overlap with each other.
          if (hasPractices && hasProblems) {
            penalty += 1000;
          }

          // Rule 3: They must be from different subjects.
          const subjectIds = new Set<string>();
          for (const assignment of classesAtThisTime) {
            if (subjectIds.has(assignment.subjectId)) {
              penalty += 1000;
            }
            subjectIds.add(assignment.subjectId);
          }
        }
      }
    }

    return penalty;
  }
}
