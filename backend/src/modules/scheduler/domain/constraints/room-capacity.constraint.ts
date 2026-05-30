import type {
  IScheduleConstraint,
  ConstraintContext,
} from './constraint.interface';

export class RoomCapacityConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): number {
    let penalty = 0;

    for (const assignment of context.assignments) {
      if (!assignment.classroomId) continue;

      const roomCapacity =
        context.classroomsCache[assignment.classroomId]?.capacity || 0;
      if (assignment.numberOfStudents > roomCapacity) {
        penalty += 1000;
      }
    }

    return penalty;
  }
}
