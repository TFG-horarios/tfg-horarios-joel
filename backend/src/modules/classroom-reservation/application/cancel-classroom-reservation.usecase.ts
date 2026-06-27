import type { IClassroomReservationRepository } from '../domain/classroom-reservation.repository';
import type { IClassroomReservationMemberProvider } from '../domain/providers/classroom-reservation-member.provider';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { ClassroomReservationDTO } from '@tfg-horarios/shared';

export class CancelClassroomReservationUseCase {
  constructor(
    private readonly repository: IClassroomReservationRepository,
    private readonly memberProvider: IClassroomReservationMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    reservationId: string
  ): Promise<ClassroomReservationDTO> {
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
          'You do not have permission to cancel this reservation.'
        );
      }
    }

    reservation.cancel();
    await this.repository.update(reservation);

    return {
      id: reservation.id,
      organizationId: reservation.organizationId,
      requesterUserId: reservation.requesterUserId,
      classroomId: reservation.classroomId,
      academicYearId: reservation.academicYearId,
      date: reservation.date,
      slotIndex: reservation.slotIndex,
      startTimeMinutes: reservation.startTimeMinutes,
      endTimeMinutes: reservation.endTimeMinutes,
      status: reservation.status,
      reason: reservation.reason,
      createdAt: reservation.createdAt.toISOString(),
      updatedAt: reservation.updatedAt.toISOString(),
    };
  }
}
