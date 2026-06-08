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

        for (let i = 0; i < classesAtThisTime.length; i++) {
          for (let j = i + 1; j < classesAtThisTime.length; j++) {
            const a = classesAtThisTime[i]!;
            const b = classesAtThisTime[j]!;

            const conflict =
              a.isCommon || b.isCommon || a.itineraryName === b.itineraryName;

            if (conflict) {
              const hasTheory =
                a.groupType === 'theory' || b.groupType === 'theory';

              if (hasTheory) {
                // Rule 1: Theory cannot overlap with anything for the same student
                penalty += 1000;
              } else {
                // Rule 2: Practices and Problems cannot overlap with each other
                if (a.groupType !== b.groupType) {
                  penalty += 1000;
                }
              }

              // Rule 3: Groups of the SAME subject can NEVER overlap.
              if (a.subjectId === b.subjectId) {
                penalty += 1000;
              }
            }
          }
        }
      }
    }

    return penalty;
  }
}
