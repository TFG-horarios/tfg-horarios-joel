import type {
  IScheduleConstraint,
  ConstraintContext,
  PenaltyResult,
  ConflictDetail,
} from '../constraint.interface';

export class LowerFloorConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): PenaltyResult {
    let penalty = 0;
    const conflicts: ConflictDetail[] = [];

    for (const assignment of context.assignments) {
      if (assignment.classroomId) {
        const cls = context.classroomsCache[assignment.classroomId];
        if (cls) {
          const floorPenalty = Math.max(0, cls.floor) * 10;
          if (floorPenalty > 0) {
            penalty += floorPenalty;
          }
        }
      }
    }

    return { penalty, conflicts };
  }
}
