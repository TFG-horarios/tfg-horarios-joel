import type {
  ConstraintContext,
  IScheduleConstraint,
  PenaltyResult,
} from '../constraint.interface';
import type { Assignment, ProjectedAssignment } from '../../types';

const OVERLAP_PEAK_PENALTY = 5;

interface TimedAssignment {
  assignment: Assignment;
  dayOfWeek: number;
  start: number;
  end: number;
}

interface TimelineEvent {
  minute: number;
  delta: number;
}

const baseKey = (timed: TimedAssignment): string =>
  `${timed.dayOfWeek}:${timed.assignment.degreeId}:${timed.assignment.courseYear}:${timed.assignment.shift}`;

const fromProjected = (projected: ProjectedAssignment): TimedAssignment => ({
  assignment: projected.assignment,
  dayOfWeek: projected.dayOfWeek,
  start: projected.startMinutes,
  end: projected.endMinutes,
});

const fromDiscreteAssignment = (
  assignment: Assignment
): TimedAssignment | null => {
  if (assignment.dayOfWeek === null || assignment.slotIndex === null) {
    return null;
  }

  const duration = Math.max(1, Math.ceil(assignment.duration));
  return {
    assignment,
    dayOfWeek: assignment.dayOfWeek,
    start: assignment.slotIndex,
    end: assignment.slotIndex + duration,
  };
};

export class OverlapDistributionConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): PenaltyResult {
    const timedAssignments = this.getTimedAssignments(context);
    const groups = new Map<string, TimedAssignment[]>();

    for (const timed of timedAssignments) {
      if (timed.end <= timed.start) continue;
      const key = baseKey(timed);
      const assignments = groups.get(key) ?? [];
      assignments.push(timed);
      groups.set(key, assignments);
    }

    let penalty = 0;
    for (const assignments of groups.values()) {
      penalty += this.calculateGroupPenalty(assignments);
    }

    return { penalty, conflicts: [] };
  }

  private getTimedAssignments(context: ConstraintContext): TimedAssignment[] {
    const projectedAssignments = context.projectedAssignments ?? [];
    if (projectedAssignments.length > 0) {
      return projectedAssignments.map(fromProjected);
    }

    return context.assignments
      .map(fromDiscreteAssignment)
      .filter(
        (assignment): assignment is TimedAssignment => assignment !== null
      );
  }

  private calculateGroupPenalty(assignments: TimedAssignment[]): number {
    const events: TimelineEvent[] = [];

    for (const timed of assignments) {
      events.push({ minute: timed.start, delta: 1 });
      events.push({ minute: timed.end, delta: -1 });
    }

    events.sort((a, b) => a.minute - b.minute || a.delta - b.delta);

    let penalty = 0;
    let active = 0;
    let index = 0;

    while (index < events.length) {
      const minute = events[index]!.minute;
      while (index < events.length && events[index]!.minute === minute) {
        active += events[index]!.delta;
        index++;
      }

      const nextMinute = events[index]?.minute;
      if (nextMinute === undefined || nextMinute <= minute) continue;

      const overlapping = Math.max(0, active - 1);
      penalty += overlapping * overlapping * OVERLAP_PEAK_PENALTY;
    }

    return penalty;
  }
}
