import { ConflictError } from '@/core/errors/app.error';
import type {
  IMoveValidationRule,
  MoveValidationContext,
} from './move-validation';

export class RoomCapacityRule implements IMoveValidationRule {
  validate(context: MoveValidationContext): void {
    if (context.newClassroomId !== null) {
      const roomCapacity =
        context.classroomsCache[context.newClassroomId]?.capacity || 0;
      if (context.movingAssignment.numberOfStudents > roomCapacity) {
        throw new ConflictError('ERR_ROOM_CAPACITY');
      }
    }
  }
}
