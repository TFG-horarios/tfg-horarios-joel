import { ConflictError } from '@/core/errors/app.error';
import type {
  IMoveValidationRule,
  MoveValidationContext,
} from './move-validation';

export class RoomTypeRule implements IMoveValidationRule {
  validate(context: MoveValidationContext): void {
    if (
      context.movingAssignment.needsComputerLab &&
      context.newClassroomId !== null &&
      context.classroomsCache[context.newClassroomId]?.type !== 'computer_lab'
    ) {
      throw new ConflictError('ERR_COMPUTER_LAB_REQUIRED');
    }
  }
}
