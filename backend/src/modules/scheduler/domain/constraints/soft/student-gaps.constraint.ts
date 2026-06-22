import type {
  IScheduleConstraint,
  ConstraintContext,
  PenaltyResult,
  ConflictDetail,
} from '../constraint.interface';
import type { Assignment } from '../../types';

export class StudentGapsConstraint implements IScheduleConstraint {
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

        const assignmentsByDay = new Map<number, Assignment[]>();
        for (const a of cohortAssignments) {
          const day = a.dayOfWeek!;
          if (!assignmentsByDay.has(day)) {
            assignmentsByDay.set(day, []);
          }
          assignmentsByDay.get(day)!.push(a);
        }

        for (const dayAssignments of assignmentsByDay.values()) {
          const activeSlots = new Set<number>();
          let minSlot = Infinity;
          let maxSlot = -Infinity;

          for (const a of dayAssignments) {
            const startSlot = a.slotIndex!;
            const endSlot = startSlot + Math.ceil(a.duration) - 1;

            minSlot = Math.min(minSlot, startSlot);
            maxSlot = Math.max(maxSlot, endSlot);

            for (let i = startSlot; i <= endSlot; i++) {
              activeSlots.add(i);
            }
          }

          if (activeSlots.size > 0) {
            const totalSpan = maxSlot - minSlot + 1;
            const gaps = totalSpan - activeSlots.size;
            
            if (gaps > 0) {
              penalty += gaps * 10;
            }
          }
        }
      }
    }

    return { penalty, conflicts };
  }
}
