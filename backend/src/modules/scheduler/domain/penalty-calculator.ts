import { type Assignment, type ClassroomMap } from './types';
import {
  ConstraintContext,
  type IScheduleConstraint,
} from './constraints/constraint.interface';

export class PenaltyCalculator {
  constructor(
    private readonly constraints: IScheduleConstraint[],
    private readonly classroomsCache: ClassroomMap,
    private readonly maxMorningSlots: number,
    private readonly maxSlotsPerDay: number
  ) {}

  public calculatePenalty(assignments: Assignment[]): number {
    const context = new ConstraintContext(
      assignments,
      this.classroomsCache,
      this.maxMorningSlots,
      this.maxSlotsPerDay
    );

    return this.constraints.reduce((totalPenalty, constraint) => {
      return totalPenalty + constraint.calculatePenalty(context);
    }, 0);
  }
}
