import { ConflictError } from '@/core/errors/app.error';
import type {
  IMoveValidationRule,
  MoveValidationContext,
} from './move-validation';
import { getUnassignedDiagnostics } from '../unassigned-diagnostics';

export class UnassignedDiagnosticRule implements IMoveValidationRule {
  validate(context: MoveValidationContext): void {
    if (
      context.newClassroomId === null ||
      context.newDayOfWeek === null ||
      context.newSlotIndex === null
    ) {
      const availableRooms = Object.keys(context.classroomsCache);
      const diag = getUnassignedDiagnostics(
        {
          needsComputerLab: context.movingAssignment.needsComputerLab,
          groupType: context.movingAssignment.groupType,
          numberOfStudents: context.movingAssignment.numberOfStudents,
        },
        context.classroomsCache,
        availableRooms
      );
      throw new ConflictError(diag.message);
    }
  }
}
