import type { IClassroomReservationRepository } from '../domain/classroom-reservation.repository';
import type { IClassroomReservationMemberProvider } from '../domain/classroom-reservation-member.provider';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';

export class DeleteClassroomReservationUseCase {
  constructor(
    private readonly repository: IClassroomReservationRepository,
    private readonly memberProvider: IClassroomReservationMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    reservationId: string
  ): Promise<void> {
    const reservation = await this.repository.findById(reservationId);

    if (!reservation || reservation.organizationId !== organizationId) {
      throw new NotFoundError('ClassroomReservation', reservationId);
    }

    if (reservation.requesterUserId !== requesterUserId) {
      const role = await this.memberProvider.getMemberRole(
        requesterUserId,
        organizationId
      );

      if (!role || !hasPermission(role, 'DELETE_ORGANIZATION_COMPONENTS')) {
        throw new ForbiddenError(
          'You do not have permission to delete this reservation.'
        );
      }
    }

    await this.repository.delete(reservationId);
  }
}
