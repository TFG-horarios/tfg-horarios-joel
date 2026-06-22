import type {
  IScheduleConstraint,
  ConstraintContext,
  PenaltyResult,
  ConflictDetail,
} from '../constraint.interface';

export class CourseOverlapConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): PenaltyResult {
    let penalty = 0;
    const conflicts: ConflictDetail[] = [];

    const groupCountsPerSubjectType = new Map<string, Set<string>>();
    for (const assignment of context.assignments) {
      const key = `${assignment.subjectId}-${assignment.shift}-${assignment.groupType}`;
      if (!groupCountsPerSubjectType.has(key)) {
        groupCountsPerSubjectType.set(key, new Set());
      }
      groupCountsPerSubjectType.get(key)!.add(assignment.subjectGroupId);
    }

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
              const isAMandatory =
                a.groupType === 'theory' ||
                groupCountsPerSubjectType.get(`${a.subjectId}-${a.shift}-${a.groupType}`)?.size === 1;
              const isBMandatory =
                b.groupType === 'theory' ||
                groupCountsPerSubjectType.get(`${b.subjectId}-${b.shift}-${b.groupType}`)?.size === 1;

              let isPenalty = false;
              if (isAMandatory || isBMandatory) {
                // Regla 1: Si es un grupo de teoria o es el unico grupo de su tipo, no puede solaparse con nada.
                isPenalty = true;
                penalty += 1000;
              } else {
                // Regla 2: Si son diferentes tipos de grupos (PE, PA, TU, PX) no pueden solaparse.
                if (a.groupType !== b.groupType) {
                  isPenalty = true;
                  penalty += 1000;
                }
              }

              // Regla 3: Si son de la misma asignatura no pueden solaparse.
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
