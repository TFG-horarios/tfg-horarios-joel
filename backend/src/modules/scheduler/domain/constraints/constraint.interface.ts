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
  public projectedByAssignmentId?: Map<string, ProjectedAssignment>;
  public roomBuckets?: Map<string, ProjectedAssignment[]>;
  public groupBuckets?: Map<string, ProjectedAssignment[]>;
  public courseBuckets?: Map<string, ProjectedAssignment[]>;
  public groupCountsPerSubjectType?: Map<string, Set<string>>;

  constructor(
    public readonly assignments: Assignment[],
    public readonly classroomsCache: ClassroomMap,
    timeGrids: ScheduleTimeGridMap = {}
  ) {
    this.timeGrids = timeGrids;
    this.projectedAssignments = [];
    this.invalidAssignments = [];
    this.projectedByAssignmentId = new Map();
    this.roomBuckets = new Map();
    this.groupBuckets = new Map();
    this.courseBuckets = new Map();
    this.groupCountsPerSubjectType = new Map();

    for (const assignment of assignments) {
      const key = `${assignment.subjectId}-${assignment.shift}-${assignment.groupType}`;
      if (!this.groupCountsPerSubjectType.has(key)) {
        this.groupCountsPerSubjectType.set(key, new Set());
      }
      this.groupCountsPerSubjectType.get(key)!.add(assignment.subjectGroupId);
    }

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
          const projected = {
            assignment,
            dayOfWeek: assignment.dayOfWeek,
            startMinutes: interval.startMinutes,
            endMinutes: interval.endMinutes,
          };
          this.projectedAssignments!.push(projected);
          this.projectedByAssignmentId.set(assignment.id, projected);
          addToBucket(
            this.groupBuckets,
            `${projected.dayOfWeek}:${assignment.subjectGroupId}`,
            projected
          );
          addToBucket(
            this.courseBuckets,
            `${projected.dayOfWeek}:${assignment.degreeId}:${assignment.courseYear}:${assignment.shift}`,
            projected
          );
          if (assignment.classroomId) {
            addToBucket(
              this.roomBuckets,
              `${projected.dayOfWeek}:${assignment.classroomId}`,
              projected
            );
          }
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

    sortBucketsByStart(this.roomBuckets);
    sortBucketsByStart(this.groupBuckets);
    sortBucketsByStart(this.courseBuckets);
  }
}

const addToBucket = (
  buckets: Map<string, ProjectedAssignment[]> | undefined,
  key: string,
  assignment: ProjectedAssignment
) => {
  if (!buckets) return;
  const bucket = buckets.get(key);
  if (bucket) {
    bucket.push(assignment);
  } else {
    buckets.set(key, [assignment]);
  }
};

const sortBucketsByStart = (
  buckets: Map<string, ProjectedAssignment[]> | undefined
) => {
  if (!buckets) return;
  for (const bucket of buckets.values()) {
    bucket.sort(
      (a, b) =>
        a.startMinutes - b.startMinutes ||
        a.endMinutes - b.endMinutes ||
        a.assignment.id.localeCompare(b.assignment.id)
    );
  }
};

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
