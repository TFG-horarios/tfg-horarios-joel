import type {
  IScheduleConstraint,
  ConstraintContext,
  PenaltyResult,
  ConflictDetail,
} from '../constraint.interface';
import type { Assignment, ProjectedAssignment } from '../../types';

interface TimedAssignment {
  assignment: Assignment;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
}

const assignmentBaseKey = (assignment: Assignment): string =>
  `${assignment.degreeId}-${assignment.courseYear}-${assignment.shift}`;

const breakMinutesBetween = (
  context: ConstraintContext,
  assignment: Assignment,
  startMinutes: number,
  endMinutes: number
): number => {
  const grid = assignment.timeConfigId
    ? context.timeGrids?.[assignment.timeConfigId]
    : undefined;

  if (!grid) return 0;

  return grid.breaks.reduce((total, breakRow) => {
    const overlapStart = Math.max(startMinutes, breakRow.startMinutes);
    const overlapEnd = Math.min(endMinutes, breakRow.endMinutes);
    return total + Math.max(0, overlapEnd - overlapStart);
  }, 0);
};

const getTimedAssignments = (
  context: ConstraintContext
): TimedAssignment[] | null => {
  const projectedAssignments = context.projectedAssignments ?? [];
  if (projectedAssignments.length === 0) return null;

  return projectedAssignments.map((projected: ProjectedAssignment) => ({
    assignment: projected.assignment,
    dayOfWeek: projected.dayOfWeek,
    startMinutes: projected.startMinutes,
    endMinutes: projected.endMinutes,
  }));
};

export class StudentGapsConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): PenaltyResult {
    const timedAssignments = getTimedAssignments(context);
    if (timedAssignments) {
      return this.calculateProjectedPenalty(context, timedAssignments);
    }

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

      const cohortItineraries =
        itineraries.size > 0 ? Array.from(itineraries) : [null];

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

  private calculateProjectedPenalty(
    context: ConstraintContext,
    timedAssignments: TimedAssignment[]
  ): PenaltyResult {
    let penalty = 0;
    const assignmentsByBaseKey = new Map<string, TimedAssignment[]>();

    for (const timed of timedAssignments) {
      const baseKey = assignmentBaseKey(timed.assignment);
      const assignments = assignmentsByBaseKey.get(baseKey) ?? [];
      assignments.push(timed);
      assignmentsByBaseKey.set(baseKey, assignments);
    }

    for (const assignments of assignmentsByBaseKey.values()) {
      const itineraries = new Set<string>();
      for (const timed of assignments) {
        const assignment = timed.assignment;
        if (!assignment.isCommon && assignment.itineraryName) {
          itineraries.add(assignment.itineraryName);
        }
      }

      const cohortItineraries =
        itineraries.size > 0 ? Array.from(itineraries) : [null];

      for (const itineraryName of cohortItineraries) {
        const cohortAssignments = assignments.filter(
          ({ assignment }) =>
            assignment.isCommon || assignment.itineraryName === itineraryName
        );

        if (cohortAssignments.length === 0) continue;

        const assignmentsByDay = new Map<number, TimedAssignment[]>();
        for (const timed of cohortAssignments) {
          const dayAssignments = assignmentsByDay.get(timed.dayOfWeek) ?? [];
          dayAssignments.push(timed);
          assignmentsByDay.set(timed.dayOfWeek, dayAssignments);
        }

        for (const dayAssignments of assignmentsByDay.values()) {
          penalty += this.calculateProjectedDayPenalty(context, dayAssignments);
        }
      }
    }

    return { penalty, conflicts: [] };
  }

  private calculateProjectedDayPenalty(
    context: ConstraintContext,
    assignments: TimedAssignment[]
  ): number {
    const ordered = [...assignments].sort(
      (a, b) =>
        a.startMinutes - b.startMinutes ||
        a.endMinutes - b.endMinutes ||
        a.assignment.id.localeCompare(b.assignment.id)
    );

    const minSessionMinutes = Math.max(
      1,
      Math.min(...ordered.map((timed) => timed.endMinutes - timed.startMinutes))
    );

    let penalty = 0;
    let currentEnd = ordered[0]?.endMinutes ?? 0;

    for (const timed of ordered.slice(1)) {
      if (timed.startMinutes > currentEnd) {
        const rawGapMinutes = timed.startMinutes - currentEnd;
        const breakMinutes = breakMinutesBetween(
          context,
          timed.assignment,
          currentEnd,
          timed.startMinutes
        );
        const effectiveGapMinutes = Math.max(0, rawGapMinutes - breakMinutes);
        const gapUnits = Math.round(effectiveGapMinutes / minSessionMinutes);
        penalty += gapUnits * 10;
      }

      currentEnd = Math.max(currentEnd, timed.endMinutes);
    }

    return penalty;
  }
}
