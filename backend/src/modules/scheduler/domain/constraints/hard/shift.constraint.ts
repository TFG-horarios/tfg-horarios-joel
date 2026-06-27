import type {
  IScheduleConstraint,
  ConstraintContext,
  PenaltyResult,
  ConflictDetail,
} from '../constraint.interface';

export class ShiftConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): PenaltyResult {
    let penalty = 0;
    const conflicts: ConflictDetail[] = [];

    for (const invalid of context.invalidAssignments ?? []) {
      const type: ConflictDetail['type'] =
        invalid.reason === 'BREAK_CROSSING'
          ? 'BREAK_CROSSING'
          : 'SHIFT_EXCEEDS_DAY';
      penalty += 1000;
      conflicts.push({
        type,
        subjectGroupId: invalid.assignment.subjectGroupId,
        assignmentId: invalid.assignment.id,
        message:
          invalid.reason === 'BREAK_CROSSING'
            ? 'Assignment crosses the configured break'
            : 'Assignment does not fit in its schedule time configuration',
      });
    }

    return { penalty, conflicts };
  }
}
