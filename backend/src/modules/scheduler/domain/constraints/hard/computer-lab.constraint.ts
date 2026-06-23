import type {
  ConflictDetail,
  ConstraintContext,
  IScheduleConstraint,
  PenaltyResult,
} from '../constraint.interface';

export class ComputerLabConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): PenaltyResult {
    let penalty = 0;
    const conflicts: ConflictDetail[] = [];

    for (const assignment of context.assignments) {
      if (!assignment.needsComputerLab || !assignment.classroomId) continue;

      if (
        context.classroomsCache[assignment.classroomId]?.type !== 'computer_lab'
      ) {
        penalty += 1000;
        conflicts.push({
          type: 'ROOM_TYPE',
          subjectGroupId: assignment.subjectGroupId,
          assignmentId: assignment.id,
          classroomId: assignment.classroomId,
          message: 'ERR_COMPUTER_LAB_REQUIRED',
        });
      }
    }

    return { penalty, conflicts };
  }
}
