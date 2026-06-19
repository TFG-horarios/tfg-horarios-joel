import type { ScheduleConflictType } from '@tfg-horarios/shared';
import type { Assignment, ClassroomMap } from '../types';

export class ConstraintContext {
  public timeSlots: Map<string, Assignment[]>;
  public degreeGroups: Map<string, Map<string, Assignment[]>>;

  constructor(
    public readonly assignments: Assignment[],
    public readonly classroomsCache: ClassroomMap,
    public readonly maxMorningSlots: number,
    public readonly maxSlotsPerDay: number
  ) {
    this.timeSlots = new Map();
    this.degreeGroups = new Map();

    for (const assignment of assignments) {
      if (assignment.dayOfWeek === null || assignment.slotIndex === null)
        continue;

      const spannedSlots = Math.ceil(assignment.duration);
      for (let d = 0; d < spannedSlots; d++) {
        const slotKey = `${assignment.dayOfWeek}-${assignment.slotIndex + d}`;

        if (!this.timeSlots.has(slotKey)) {
          this.timeSlots.set(slotKey, []);
        }
        this.timeSlots.get(slotKey)!.push(assignment);

        const degreeCourseKey = `${assignment.degreeId}-${assignment.courseYear}`;
        if (!this.degreeGroups.has(degreeCourseKey)) {
          this.degreeGroups.set(degreeCourseKey, new Map());
        }
        const timeSlotsForDegree = this.degreeGroups.get(degreeCourseKey)!;
        if (!timeSlotsForDegree.has(slotKey)) {
          timeSlotsForDegree.set(slotKey, []);
        }
        timeSlotsForDegree.get(slotKey)!.push(assignment);
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
