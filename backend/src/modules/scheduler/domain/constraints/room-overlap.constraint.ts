import type {
  IScheduleConstraint,
  ConstraintContext,
} from './constraint.interface';

export class RoomOverlapConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): number {
    let penalty = 0;

    for (const classesAtThisTime of context.timeSlots.values()) {
      const seenClassrooms = new Set<string>();
      for (const assignment of classesAtThisTime) {
        if (!assignment.classroomId) continue;

        if (seenClassrooms.has(assignment.classroomId)) {
          penalty += 1000;
        }
        seenClassrooms.add(assignment.classroomId);
      }
    }

    return penalty;
  }
}
