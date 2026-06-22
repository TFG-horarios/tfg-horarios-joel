import type {
  IScheduleConstraint,
  ConstraintContext,
  PenaltyResult,
  ConflictDetail,
} from '../constraint.interface';

export class RoomTypeConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): PenaltyResult {
    let penalty = 0;
    const conflicts: ConflictDetail[] = [];

    for (const assignment of context.assignments) {
      if (assignment.classroomId) {
        const cls = context.classroomsCache[assignment.classroomId];
        if (cls) {
          if (
            ['practices', 'reduced_practices', 'tutoring'].includes(
              assignment.groupType
            ) &&
            cls.type !== 'lab'
          ) {
            penalty += 10;
          }
          if (
            !['practices', 'reduced_practices', 'tutoring'].includes(
              assignment.groupType
            ) &&
            cls.type === 'lab'
          ) {
            penalty += 10;
          }
        }
      }
    }

    return { penalty, conflicts };
  }
}
