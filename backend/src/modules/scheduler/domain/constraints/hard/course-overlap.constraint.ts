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
              const isATheory = a.groupType === 'theory';
              const isBTheory = b.groupType === 'theory';
              const isASingleGroup = a.groupType !== 'theory' && groupCountsPerSubjectType.get(`${a.subjectId}-${a.shift}-${a.groupType}`)?.size === 1;
              const isBSingleGroup = b.groupType !== 'theory' && groupCountsPerSubjectType.get(`${b.subjectId}-${b.shift}-${b.groupType}`)?.size === 1;

              const addConflict = (type: ConflictDetail['type']) => {
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
                // Regla 1: Una asignatura común NUNCA puede solaparse con una de itinerario
                addConflict('COURSE_OVERLAP_COMMON_ITINERARY');
              } else if (isATheory || isBTheory) {
                // Regla 2: Teoría no puede solaparse con nada.
                addConflict('COURSE_OVERLAP_THEORY');
              } else if (isASingleGroup || isBSingleGroup) {
                // Regla 3: Un grupo único de su tipo no puede solaparse con nada.
                addConflict('COURSE_OVERLAP_SINGLE_GROUP');
              } else {
                // Regla 4: Si son diferentes tipos de grupos (PE, PA, TU, PX) no pueden solaparse.
                if (a.groupType !== b.groupType) {
                  addConflict('COURSE_OVERLAP_DIFFERENT_GROUP_TYPES');
                }
              }

              // Regla 5: Si son de la misma asignatura no pueden solaparse.
              if (a.subjectId === b.subjectId) {
                addConflict('COURSE_OVERLAP_SAME_SUBJECT');
              }
            }
          }
        }
      }
    }

    return { penalty, conflicts };
  }
}
