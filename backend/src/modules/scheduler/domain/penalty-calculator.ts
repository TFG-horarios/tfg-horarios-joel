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

  public evaluateHard(
    assignments: Assignment[],
    lockedAssignments: Assignment[] = []
  ): { hardPenalty: number; conflicts: ConflictDetail[] } {
    const context = this.buildContext(assignments, lockedAssignments);
    return this._calculateHard(context);
  }

  public evaluateSoft(
    assignments: Assignment[],
    lockedAssignments: Assignment[] = []
  ): { softPenalty: number } {
    const context = this.buildContext(assignments, lockedAssignments);
    return this._calculateSoft(context);
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
    const context = this.buildContext(assignments, lockedAssignments);
    const { hardPenalty, conflicts } = this._calculateHard(context);
    const { softPenalty } = this._calculateSoft(context);

    return {
      hardPenalty,
      softPenalty,
      totalPenalty: hardPenalty + softPenalty,
      conflicts,
    };
  }

  private buildContext(
    assignments: Assignment[],
    lockedAssignments: Assignment[]
  ): ConstraintContext {
    const allAssignments = [...assignments, ...lockedAssignments];
    return new ConstraintContext(
      allAssignments,
      this.classroomsCache,
      this.maxMorningSlots,
      this.maxSlotsPerDay
    );
  }

  private _calculateHard(context: ConstraintContext): {
    hardPenalty: number;
    conflicts: ConflictDetail[];
  } {
    let hardPenalty = 0;
    const conflicts: ConflictDetail[] = [];
    for (const constraint of this.hardConstraints) {
      const result = constraint.calculatePenalty(context);
      hardPenalty += result.penalty;
      if (result.conflicts) {
        conflicts.push(...result.conflicts);
      }
    }
    return { hardPenalty, conflicts };
  }

  private _calculateSoft(context: ConstraintContext): { softPenalty: number } {
    let softPenalty = 0;
    for (const constraint of this.softConstraints) {
      const result = constraint.calculatePenalty(context);
      softPenalty += result.penalty;
    }
    return { softPenalty };
  }
}
