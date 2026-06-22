import type {
  IScheduleConstraint,
  ConstraintContext,
  PenaltyResult,
  ConflictDetail,
} from '../constraint.interface';
import type { Assignment } from '../../types';

export class SubjectDistributionConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): PenaltyResult {
    let penalty = 0;
    const conflicts: ConflictDetail[] = [];

    const assignmentsByBaseKey = new Map<string, Assignment[]>();

    for (const assignment of context.assignments) {
      if (assignment.dayOfWeek === null || assignment.slotIndex === null) {
        continue;
      }

      const baseKey = `${assignment.degreeId}-${assignment.courseYear}-${assignment.shift}`;
      if (!assignmentsByBaseKey.has(baseKey)) {
        assignmentsByBaseKey.set(baseKey, []);
      }
      assignmentsByBaseKey.get(baseKey)!.push(assignment);
    }

    for (const assignments of assignmentsByBaseKey.values()) {
      const itineraries = new Set<string>();
      for (const a of assignments) {
        if (!a.isCommon && a.itineraryName) {
          itineraries.add(a.itineraryName);
        }
      }

      const cohortItineraries = itineraries.size > 0 ? Array.from(itineraries) : [null];

      for (const itineraryName of cohortItineraries) {
        const cohortAssignments = assignments.filter(
          (a) => a.isCommon || a.itineraryName === itineraryName
        );

        if (cohortAssignments.length === 0) continue;

        const subjects = new Map<string, Assignment[]>();
        for (const a of cohortAssignments) {
          if (!subjects.has(a.subjectId)) subjects.set(a.subjectId, []);
          subjects.get(a.subjectId)!.push(a);
        }

        for (const subjectAssignments of subjects.values()) {
          const days = new Map<number, Assignment[]>();
          for (const a of subjectAssignments) {
            const day = a.dayOfWeek!;
            if (!days.has(day)) days.set(day, []);
            days.get(day)!.push(a);
          }

          for (const dayAssignments of days.values()) {
            const groupTypes = new Map<string, Assignment[]>();
            for (const a of dayAssignments) {
              if (!groupTypes.has(a.groupType)) groupTypes.set(a.groupType, []);
              groupTypes.get(a.groupType)!.push(a);
            }

            let maxSlotsStudentTakes = 0;

            for (const typeAssignments of groupTypes.values()) {
              const groups = new Map<string, number>();
              for (const a of typeAssignments) {
                const dur = groups.get(a.subjectGroupId) || 0;
                groups.set(a.subjectGroupId, dur + a.duration);
              }

              let maxForType = 0;
              for (const dur of groups.values()) {
                if (dur > maxForType) maxForType = dur;
              }
              maxSlotsStudentTakes += maxForType;
            }

            if (maxSlotsStudentTakes > 2) {
              penalty += (maxSlotsStudentTakes - 2) * 20;
            }
          }
        }
      }
    }

    return { penalty, conflicts };
  }
}
