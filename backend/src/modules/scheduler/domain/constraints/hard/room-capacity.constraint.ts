import type {
  IScheduleConstraint,
  ConstraintContext,
  PenaltyResult,
  ConflictDetail,
} from '../constraint.interface';

export class RoomCapacityConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): PenaltyResult {
    let penalty = 0;
    const conflicts: ConflictDetail[] = [];

    for (const assignment of context.assignments) {
      if (!assignment.classroomId) continue;

      const roomCapacity =
        context.classroomsCache[assignment.classroomId]?.capacity || 0;
      if (assignment.numberOfStudents > roomCapacity) {
        penalty += 1000;
        conflicts.push({
          type: 'ROOM_CAPACITY',
          subjectGroupId: assignment.subjectGroupId,
          assignmentId: assignment.id,
          classroomId: assignment.classroomId,
          message: `Students: ${assignment.numberOfStudents}, Capacity: ${roomCapacity}`,
        });
      }
    }

    return { penalty, conflicts };
  }
}
