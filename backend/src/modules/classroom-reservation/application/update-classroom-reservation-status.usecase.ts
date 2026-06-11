import type {
  ClassroomReservationDTO,
  UpdateClassroomReservationStatusDTO,
} from '@tfg-horarios/shared';
import type { IClassroomReservationRepository } from '../domain/classroom-reservation.repository';
import type { IClassroomReservationScheduleProvider } from '../domain/classroom-reservation-schedule.provider';
import type { IClassroomReservationMemberProvider } from '../domain/classroom-reservation-member.provider';
import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';
import { ClassroomReservationMapper } from './classroom-reservation.mapper';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';

export class UpdateClassroomReservationStatusUseCase {
  constructor(
    private readonly repository: IClassroomReservationRepository,
    private readonly scheduleProvider: IClassroomReservationScheduleProvider,
    private readonly memberProvider: IClassroomReservationMemberProvider,
    private readonly academicYearRepository: IAcademicYearRepository
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    reservationId: string,
    dto: UpdateClassroomReservationStatusDTO
  ): Promise<ClassroomReservationDTO> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );

    if (!role || !hasPermission(role, 'UPDATE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to update reservation statuses.'
      );
    }

    const reservation = await this.repository.findById(reservationId);
    if (!reservation || reservation.organizationId !== organizationId) {
      throw new NotFoundError('ClassroomReservation', reservationId);
    }

    if (dto.status === 'ACCEPTED') {
      if (reservation.isExpired()) {
        throw new ValidationError(
          'No se puede aceptar una reserva que ya ha expirado.'
        );
      }

      const reservationDate = new Date(reservation.date);
      const jsDay = reservationDate.getDay();
      const systemDayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

      const academicYear = await this.academicYearRepository.findById(
        reservation.academicYearId
      );
      if (!academicYear || academicYear.organizationId !== organizationId) {
        throw new NotFoundError('AcademicYear', reservation.academicYearId);
      }

      const matchingPeriods = academicYear.getMatchingPeriods(reservationDate);

      const hasSubject = await this.scheduleProvider.hasSubjectInSlot(
        organizationId,
        reservation.academicYearId,
        matchingPeriods,
        reservation.classroomId,
        systemDayOfWeek,
        reservation.slotIndex
      );

      if (hasSubject) {
        throw new ValidationError(
          'No se puede aceptar la reserva porque el aula ha sido ocupada por una asignatura en esa fecha y hora.'
        );
      }

      reservation.accept();
    } else if (dto.status === 'REJECTED') {
      reservation.reject();
    }

    await this.repository.update(reservation);

    return ClassroomReservationMapper.toDTO(reservation);
  }
}
