import type {
  IScheduleConstraint,
  ConstraintContext,
  PenaltyResult,
  ConflictDetail,
} from './constraint.interface';

export class CourseOverlapConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): PenaltyResult {
    let penalty = 0;
    const conflicts: ConflictDetail[] = [];

    for (const timeSlotsForDegree of context.degreeGroups.values()) {
      for (const classesAtThisTime of timeSlotsForDegree.values()) {
        if (classesAtThisTime.length <= 1) {
          continue;
        }

        for (let i = 0; i < classesAtThisTime.length; i++) {
          for (let j = i + 1; j < classesAtThisTime.length; j++) {
            const a = classesAtThisTime[i]!;
            const b = classesAtThisTime[j]!;
            // TODO: REVISAR BIEN LAS CONDICIONES DE SOLAPAMIENTO
            const conflict =
              a.isCommon || b.isCommon || a.itineraryName === b.itineraryName;

            if (conflict) {
              const hasTheory =
                a.groupType === 'theory' || b.groupType === 'theory';

              let isPenalty = false;
              if (hasTheory) {
                // Rule 1: Theory cannot overlap with anything for the same student
                isPenalty = true;
                penalty += 1000;
              } else {
                // Rule 2: Practices and Problems cannot overlap with each other
                if (a.groupType !== b.groupType) {
                  isPenalty = true;
                  penalty += 1000;
                }
              }

              // Rule 3: Groups of the SAME subject can NEVER overlap.
              if (a.subjectId === b.subjectId) {
                isPenalty = true;
                penalty += 1000;
              }

              if (isPenalty) {
                conflicts.push({
                  type: 'COURSE_OVERLAP',
                  subjectGroupId: a.subjectGroupId,
                  assignmentId: a.id,
                  relatedSubjectGroupIds: [b.subjectGroupId],
                  message: `Overlap with ${b.subjectGroupId}`,
                });
                conflicts.push({
                  type: 'COURSE_OVERLAP',
                  subjectGroupId: b.subjectGroupId,
                  assignmentId: b.id,
                  relatedSubjectGroupIds: [a.subjectGroupId],
                  message: `Overlap with ${a.subjectGroupId}`,
                });
              }
            }
          }
        }
      }
    }

    return { penalty, conflicts };
  }
}
