import type {
  IScheduleConstraint,
  ConstraintContext,
  PenaltyResult,
  ConflictDetail,
} from '../constraint.interface';

export class RoomOverlapConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): PenaltyResult {
    let penalty = 0;
    const conflicts: ConflictDetail[] = [];
    const registeredPairs = new Set<string>();

    for (const classesAtThisTime of context.timeSlots.values()) {
      const roomOccupants = new Map<string, (typeof classesAtThisTime)[0]>();
      for (const assignment of classesAtThisTime) {
        if (!assignment.classroomId) continue;

        const existingOccupant = roomOccupants.get(assignment.classroomId);
        if (existingOccupant) {
          const pairKey = [existingOccupant.id, assignment.id].sort().join(':');
          if (registeredPairs.has(pairKey)) continue;
          registeredPairs.add(pairKey);

          penalty += 1000;
          conflicts.push({
            type: 'ROOM_OVERLAP',
            subjectGroupId: assignment.subjectGroupId,
            assignmentId: assignment.id,
            relatedSubjectGroupIds: [existingOccupant.subjectGroupId],
            classroomId: assignment.classroomId,
          });
          conflicts.push({
            type: 'ROOM_OVERLAP',
            subjectGroupId: existingOccupant.subjectGroupId,
            assignmentId: existingOccupant.id,
            relatedSubjectGroupIds: [assignment.subjectGroupId],
            classroomId: assignment.classroomId,
          });
        } else {
          roomOccupants.set(assignment.classroomId, assignment);
        }
      }
    }

    return { penalty, conflicts };
  }
}
