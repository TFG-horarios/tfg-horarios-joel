import { type Assignment, type ClassroomMap } from './types';
import {
  ConstraintContext,
  type IScheduleConstraint,
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
  ): { hardPenalty: number; softPenalty: number; totalPenalty: number } {
    const allAssignments = [...assignments, ...lockedAssignments];
    const context = new ConstraintContext(
      allAssignments,
      this.classroomsCache,
      this.maxMorningSlots,
      this.maxSlotsPerDay
    );

    let hardPenalty = 0;
    for (const constraint of this.hardConstraints) {
      hardPenalty += constraint.calculatePenalty(context);
    }

    let softPenalty = 0;
    for (const constraint of this.softConstraints) {
      softPenalty += constraint.calculatePenalty(context);
    }

    return {
      hardPenalty,
      softPenalty,
      totalPenalty: hardPenalty + softPenalty,
    };
  }
}
