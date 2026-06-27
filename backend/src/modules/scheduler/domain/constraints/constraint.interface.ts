import type { ScheduleConflictType } from '@tfg-horarios/shared';
import {
  crossesBreakBoundary,
  projectAssignmentInterval,
} from '@tfg-horarios/shared';
import type {
  Assignment,
  ClassroomMap,
  InvalidAssignment,
  ProjectedAssignment,
  ScheduleTimeGridMap,
} from '../types';

export class ConstraintContext {
  public projectedAssignments?: ProjectedAssignment[];
  public invalidAssignments?: InvalidAssignment[];
  public timeGrids?: ScheduleTimeGridMap;

  constructor(
    public readonly assignments: Assignment[],
    public readonly classroomsCache: ClassroomMap,
    timeGrids: ScheduleTimeGridMap = {}
  ) {
    this.timeGrids = timeGrids;
    this.projectedAssignments = [];
    this.invalidAssignments = [];

    for (const assignment of assignments) {
      if (assignment.dayOfWeek === null || assignment.slotIndex === null)
        continue;

      const grid = assignment.timeConfigId
        ? this.timeGrids[assignment.timeConfigId]
        : undefined;
      if (grid) {
        const interval = projectAssignmentInterval(
          grid,
          assignment.slotIndex,
          assignment.duration
        );
        if (interval) {
          this.projectedAssignments!.push({
            assignment,
            dayOfWeek: assignment.dayOfWeek,
            startMinutes: interval.startMinutes,
            endMinutes: interval.endMinutes,
          });
        } else {
          this.invalidAssignments!.push({
            assignment,
            reason: crossesBreakBoundary(
              assignment.slotIndex,
              assignment.duration,
              grid.breakBoundaries
            )
              ? 'BREAK_CROSSING'
              : 'OUT_OF_BOUNDS',
          });
        }
      } else {
        this.invalidAssignments!.push({
          assignment,
          reason: 'MISSING_TIME_CONFIG',
        });
      }
    }
  }
}

export interface ConflictDetail {
  type: ScheduleConflictType;
  message?: string;
  subjectGroupId: string;
  assignmentId?: string;
  classroomId?: string;
  relatedSubjectGroupIds?: string[];
}

export interface PenaltyResult {
  penalty: number;
  conflicts: ConflictDetail[];
}

export interface IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): PenaltyResult;
}
