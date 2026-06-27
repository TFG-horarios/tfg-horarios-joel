import { ConflictError } from '@/core/errors/app.error';
import { crossesBreakBoundary } from '@tfg-horarios/shared';
import type {
  IMoveValidationRule,
  MoveValidationContext,
} from './move-validation';

export class ShiftRule implements IMoveValidationRule {
  validate(context: MoveValidationContext): void {
    if (
      context.newSlotIndex === null ||
      context.timeGrids === undefined ||
      context.projectIntervalForPlacement === undefined
    ) {
      return;
    }

    const grid = context.movingAssignment.timeConfigId
      ? context.timeGrids[context.movingAssignment.timeConfigId]
      : undefined;
    const interval = context.projectIntervalForPlacement(
      context.movingAssignment.timeConfigId,
      context.newSlotIndex,
      context.movingAssignment.duration
    );
    if (!interval) {
      if (
        grid &&
        crossesBreakBoundary(
          context.newSlotIndex,
          context.movingAssignment.duration,
          grid.breakBoundaries
        )
      ) {
        throw new ConflictError('ERR_BREAK_CROSSING');
      }
      throw new ConflictError('ERR_SHIFT_EXCEEDS_DAY');
    }
  }
}
