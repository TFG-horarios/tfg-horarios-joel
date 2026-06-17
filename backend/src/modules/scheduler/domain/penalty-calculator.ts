import { type Assignment, type ClassroomMap } from './types';
import {
  ConstraintContext,
  type IScheduleConstraint,
  type ConflictDetail,
} from './constraints/constraint.interface';

export class PenaltyCalculator {
  constructor(
    private readonly hardConstraints: IScheduleConstraint[],
    private readonly softConstraints: IScheduleConstraint[],
    private readonly classroomsCache: ClassroomMap,
    private readonly maxMorningSlots: number,
    private readonly maxSlotsPerDay: number
  ) {}

  public calculatePenalty(
    assignments: Assignment[],
    lockedAssignments: Assignment[] = []
  ): number {
    return this.evaluate(assignments, lockedAssignments).totalPenalty;
  }

  public evaluate(
    assignments: Assignment[],
    lockedAssignments: Assignment[] = []
  ): {
    hardPenalty: number;
    softPenalty: number;
    totalPenalty: number;
    conflicts: ConflictDetail[];
  } {
    const allAssignments = [...assignments, ...lockedAssignments];
    const context = new ConstraintContext(
      allAssignments,
      this.classroomsCache,
      this.maxMorningSlots,
      this.maxSlotsPerDay
    );

    let hardPenalty = 0;
    const conflicts: ConflictDetail[] = [];
    for (const constraint of this.hardConstraints) {
      const result = constraint.calculatePenalty(context);
      hardPenalty += result.penalty;
      if (result.conflicts) {
        conflicts.push(...result.conflicts);
      }
    }

    let softPenalty = 0;
    for (const constraint of this.softConstraints) {
      const result = constraint.calculatePenalty(context);
      softPenalty += result.penalty;
    }

    return {
      hardPenalty,
      softPenalty,
      totalPenalty: hardPenalty + softPenalty,
      conflicts,
    };
  }
}
