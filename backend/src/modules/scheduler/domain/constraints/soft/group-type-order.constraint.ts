import type { GroupType } from '@tfg-horarios/shared';
import type { Assignment, ProjectedAssignment } from '../../types';
import type {
  ConstraintContext,
  IScheduleConstraint,
  PenaltyResult,
} from '../constraint.interface';

type GroupTypeRank = 0 | 1 | 2;

const OUT_OF_ORDER_PENALTY = 10;
const INTERLEAVING_PENALTY = 20;

const getGroupTypeRank = (groupType: GroupType): GroupTypeRank => {
  if (groupType === 'theory') return 0;
  if (groupType === 'problems') return 1;
  return 2;
};

const getItineraryKey = (assignment: Assignment): string | null => {
  if (assignment.itineraryId) return `id:${assignment.itineraryId}`;
  if (assignment.itineraryName) return `name:${assignment.itineraryName}`;
  return null;
};

interface OrderedAssignment {
  assignment: Assignment;
  dayOfWeek: number;
  startMinutes: number | null;
}

export class GroupTypeOrderConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): PenaltyResult {
    const projectedAssignments = context.projectedAssignments ?? [];
    if (projectedAssignments.length > 0) {
      return {
        penalty: this.calculateProjectedPenalty(projectedAssignments),
        conflicts: [],
      };
    }

    const assignmentsBySchedule = new Map<string, Assignment[]>();

    for (const assignment of context.assignments) {
      if (assignment.dayOfWeek === null || assignment.slotIndex === null) {
        continue;
      }

      const scheduleKey = `${assignment.degreeId}-${assignment.courseYear}-${assignment.shift}`;
      const scheduleAssignments = assignmentsBySchedule.get(scheduleKey) ?? [];
      scheduleAssignments.push(assignment);
      assignmentsBySchedule.set(scheduleKey, scheduleAssignments);
    }

    let penalty = 0;

    for (const scheduleAssignments of assignmentsBySchedule.values()) {
      const itineraryKeys = new Set<string | null>();

      for (const assignment of scheduleAssignments) {
        if (!assignment.isCommon) {
          itineraryKeys.add(getItineraryKey(assignment));
        }
      }

      if (itineraryKeys.size === 0) {
        itineraryKeys.add(null);
      }

      for (const itineraryKey of itineraryKeys) {
        const cohortAssignments = scheduleAssignments.filter(
          (assignment) =>
            assignment.isCommon || getItineraryKey(assignment) === itineraryKey
        );
        const assignmentsByDay = new Map<number, Assignment[]>();

        for (const assignment of cohortAssignments) {
          const dayAssignments =
            assignmentsByDay.get(assignment.dayOfWeek!) ?? [];
          dayAssignments.push(assignment);
          assignmentsByDay.set(assignment.dayOfWeek!, dayAssignments);
        }

        for (const dayAssignments of assignmentsByDay.values()) {
          penalty += this.calculateDayPenalty(dayAssignments);
        }
      }
    }

    return { penalty, conflicts: [] };
  }

  private calculateProjectedPenalty(
    projectedAssignments: ProjectedAssignment[]
  ): number {
    const assignmentsBySchedule = new Map<string, OrderedAssignment[]>();

    for (const projected of projectedAssignments) {
      const assignment = projected.assignment;
      const scheduleKey = `${assignment.degreeId}-${assignment.courseYear}-${assignment.shift}`;
      const scheduleAssignments = assignmentsBySchedule.get(scheduleKey) ?? [];
      scheduleAssignments.push({
        assignment,
        dayOfWeek: projected.dayOfWeek,
        startMinutes: projected.startMinutes,
      });
      assignmentsBySchedule.set(scheduleKey, scheduleAssignments);
    }

    let penalty = 0;

    for (const scheduleAssignments of assignmentsBySchedule.values()) {
      const itineraryKeys = new Set<string | null>();

      for (const { assignment } of scheduleAssignments) {
        if (!assignment.isCommon) {
          itineraryKeys.add(getItineraryKey(assignment));
        }
      }

      if (itineraryKeys.size === 0) {
        itineraryKeys.add(null);
      }

      for (const itineraryKey of itineraryKeys) {
        const cohortAssignments = scheduleAssignments.filter(
          ({ assignment }) =>
            assignment.isCommon || getItineraryKey(assignment) === itineraryKey
        );
        const assignmentsByDay = new Map<number, OrderedAssignment[]>();

        for (const assignment of cohortAssignments) {
          const dayAssignments =
            assignmentsByDay.get(assignment.dayOfWeek) ?? [];
          dayAssignments.push(assignment);
          assignmentsByDay.set(assignment.dayOfWeek, dayAssignments);
        }

        for (const dayAssignments of assignmentsByDay.values()) {
          penalty += this.calculateDayPenalty(dayAssignments);
        }
      }
    }

    return penalty;
  }

  private calculateDayPenalty(assignments: OrderedAssignment[]): number;
  private calculateDayPenalty(assignments: Assignment[]): number;
  private calculateDayPenalty(
    assignments: Array<Assignment | OrderedAssignment>
  ): number {
    const orderedAssignments = [...assignments].sort(
      (a, b) =>
        this.getOrderStart(a) - this.getOrderStart(b) ||
        getGroupTypeRank(this.getAssignment(a).groupType) -
          getGroupTypeRank(this.getAssignment(b).groupType) ||
        this.getAssignment(a).id.localeCompare(this.getAssignment(b).id)
    );
    const blocks: GroupTypeRank[] = [];

    for (const item of orderedAssignments) {
      const rank = getGroupTypeRank(this.getAssignment(item).groupType);
      if (blocks.at(-1) !== rank) {
        blocks.push(rank);
      }
    }

    let penalty = 0;
    const seenRanks = new Set<GroupTypeRank>();

    for (let index = 0; index < blocks.length; index++) {
      const rank = blocks[index]!;
      const previousRank = blocks[index - 1];

      if (previousRank !== undefined && rank < previousRank) {
        penalty += OUT_OF_ORDER_PENALTY;
      }
      if (seenRanks.has(rank)) {
        penalty += INTERLEAVING_PENALTY;
      }

      seenRanks.add(rank);
    }

    return penalty;
  }

  private getAssignment(item: Assignment | OrderedAssignment): Assignment {
    return 'assignment' in item ? item.assignment : item;
  }

  private getOrderStart(item: Assignment | OrderedAssignment): number {
    if ('startMinutes' in item && item.startMinutes !== null) {
      return item.startMinutes;
    }
    return this.getAssignment(item).slotIndex ?? Number.POSITIVE_INFINITY;
  }
}
