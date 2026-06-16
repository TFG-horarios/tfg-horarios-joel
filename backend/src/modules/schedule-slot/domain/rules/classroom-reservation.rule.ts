import { ConflictError } from '@/core/errors/app.error';
import type {
  IMoveValidationRule,
  MoveValidationContext,
} from './move-validation';

export interface IScheduleSlotReservationProvider {
  hasAcceptedFutureReservation(
    organizationId: string,
    classroomId: string,
    dayOfWeek: number,
    slotIndex: number
  ): Promise<boolean>;
}

export class ClassroomReservationRule implements IMoveValidationRule {
  constructor(
    private readonly reservationProvider: IScheduleSlotReservationProvider
  ) {}

  async validate(context: MoveValidationContext): Promise<void> {
    if (
      context.newClassroomId !== null &&
      context.newDayOfWeek !== null &&
      context.newSlotIndex !== null
    ) {
      const hasReservation =
        await this.reservationProvider.hasAcceptedFutureReservation(
          context.organizationId,
          context.newClassroomId,
          context.newDayOfWeek,
          context.newSlotIndex
        );

      if (hasReservation) {
        throw new ConflictError('ERR_RESERVATION_OVERLAP');
      }
    }
  }
}
