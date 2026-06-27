import type {
  ConstraintContext,
  IScheduleConstraint,
  PenaltyResult,
} from '../constraint.interface';

const EXTRA_SESSION_PENALTY = 10;
const EXTRA_GROUP_TYPE_PENALTY = 10;

export class SubjectDailyDispersionConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): PenaltyResult {
    const sessionsByGroupAndDay = new Map<string, number>();
    const groupTypesBySubjectShiftAndDay = new Map<string, Set<string>>();
    const projectedAssignments = context.projectedAssignments ?? [];
    const assignments =
      projectedAssignments.length > 0
        ? projectedAssignments.map((projected) => ({
            assignment: projected.assignment,
            dayOfWeek: projected.dayOfWeek,
          }))
        : context.assignments.map((assignment) => ({
            assignment,
            dayOfWeek: assignment.dayOfWeek,
          }));

    for (const { assignment, dayOfWeek } of assignments) {
      if (dayOfWeek === null) {
        continue;
      }

      if (projectedAssignments.length === 0 && assignment.slotIndex === null) {
        continue;
      }

      const groupDayKey = `${assignment.subjectGroupId}-${dayOfWeek}`;
      sessionsByGroupAndDay.set(
        groupDayKey,
        (sessionsByGroupAndDay.get(groupDayKey) ?? 0) + 1
      );

      const subjectShiftDayKey = `${assignment.subjectId}-${assignment.shift}-${dayOfWeek}`;
      const groupTypes =
        groupTypesBySubjectShiftAndDay.get(subjectShiftDayKey) ??
        new Set<string>();
      groupTypes.add(assignment.groupType);
      groupTypesBySubjectShiftAndDay.set(subjectShiftDayKey, groupTypes);
    }

    let penalty = 0;

    for (const sessionCount of sessionsByGroupAndDay.values()) {
      penalty += Math.max(0, sessionCount - 1) * EXTRA_SESSION_PENALTY;
    }

    for (const groupTypes of groupTypesBySubjectShiftAndDay.values()) {
      penalty += Math.max(0, groupTypes.size - 1) * EXTRA_GROUP_TYPE_PENALTY;
    }

    return { penalty, conflicts: [] };
  }
}
