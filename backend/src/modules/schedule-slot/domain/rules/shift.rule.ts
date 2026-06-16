import { ConflictError } from '@/core/errors/app.error';
import type {
  IMoveValidationRule,
  MoveValidationContext,
} from './move-validation';

export class ShiftRule implements IMoveValidationRule {
  validate(context: MoveValidationContext): void {
    if (context.newSlotIndex !== null) {
      const isMorningSlot = context.newSlotIndex < context.maxMorningSlots;
      const bleedsIntoAfternoon =
        context.newSlotIndex + Math.ceil(context.movingAssignment.duration) >
        context.maxMorningSlots;
      const bleedsOutOfDay =
        context.newSlotIndex + Math.ceil(context.movingAssignment.duration) >
        context.maxSlotsPerDay;

      if (context.movingAssignment.shift === 'morning') {
        if (!isMorningSlot || bleedsIntoAfternoon) {
          throw new ConflictError('ERR_SHIFT_MORNING');
        }
      }

      if (context.movingAssignment.shift === 'afternoon') {
        if (isMorningSlot) {
          throw new ConflictError('ERR_SHIFT_AFTERNOON');
        }
        if (bleedsOutOfDay) {
          throw new ConflictError('ERR_SHIFT_EXCEEDS_DAY');
        }
      }
    }
  }
}
