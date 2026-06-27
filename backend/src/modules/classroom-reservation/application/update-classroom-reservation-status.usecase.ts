import type {
  ClassroomReservationDTO,
  UpdateClassroomReservationStatusDTO,
} from '@tfg-horarios/shared';
import type { IClassroomReservationRepository } from '../domain/classroom-reservation.repository';
import type { IClassroomReservationScheduleProvider } from '../domain/providers/classroom-reservation-schedule.provider';
import type { IClassroomReservationMemberProvider } from '../domain/providers/classroom-reservation-member.provider';
import type { IClassroomReservationAcademicYearProvider } from '../domain/providers/classroom-reservation-academic-year.provider';
import type { IClassroomReservationNotificationProvider } from '../domain/providers/classroom-reservation-notification.provider';
import { ClassroomReservationMapper } from './classroom-reservation.mapper';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { intervalsOverlap, parseTimeToMinutes } from '@tfg-horarios/shared';

export class UpdateClassroomReservationStatusUseCase {
  constructor(
    private readonly repository: IClassroomReservationRepository,
    private readonly scheduleProvider: IClassroomReservationScheduleProvider,
    private readonly memberProvider: IClassroomReservationMemberProvider,
    private readonly academicYearProvider: IClassroomReservationAcademicYearProvider,
    private readonly notificationProvider: IClassroomReservationNotificationProvider
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

    if (!role || !hasPermission(role, 'MANAGE_RESERVATION_REQUEST')) {
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
        throw new ValidationError('You cannot accept an expired reservation.');
      }

      const reservationDate = new Date(reservation.date);
      const jsDay = reservationDate.getUTCDay();
      const systemDayOfWeek = jsDay === 0 ? 7 : jsDay;

      const matchingPeriods =
        await this.academicYearProvider.getMatchingPeriods(
          organizationId,
          reservation.academicYearId,
          reservationDate
        );

      if (!matchingPeriods) {
        throw new NotFoundError('AcademicYear', reservation.academicYearId);
      }

      if (
        reservation.startTimeMinutes === null ||
        reservation.endTimeMinutes === null
      ) {
        throw new ValidationError(
          'No se puede aceptar la reserva porque no tiene un intervalo horario real.'
        );
      }

      const academicYear = await this.academicYearProvider.getAcademicYear(
        organizationId,
        reservation.academicYearId
      );

      if (!academicYear) {
        throw new NotFoundError('AcademicYear', reservation.academicYearId);
      }

      const centerOpeningMinutes = parseTimeToMinutes(
        academicYear.centerOpeningTime
      );
      const centerClosingMinutes = parseTimeToMinutes(
        academicYear.centerClosingTime
      );

      if (
        reservation.startTimeMinutes < centerOpeningMinutes ||
        reservation.endTimeMinutes > centerClosingMinutes ||
        reservation.endTimeMinutes <= reservation.startTimeMinutes
      ) {
        throw new ValidationError(
          'No se puede aceptar la reserva porque queda fuera del horario de apertura del centro.'
        );
      }

      const interval = {
        startTimeMinutes: reservation.startTimeMinutes,
        endTimeMinutes: reservation.endTimeMinutes,
      };

      const hasSubject = await this.scheduleProvider.hasSubjectInInterval(
        organizationId,
        reservation.academicYearId,
        matchingPeriods,
        reservation.classroomId,
        systemDayOfWeek,
        interval.startTimeMinutes,
        interval.endTimeMinutes
      );

      if (hasSubject) {
        throw new ValidationError(
          'No se puede aceptar la reserva porque el aula ha sido ocupada por una asignatura en esa fecha y hora.'
        );
      }

      const reservations = await this.repository.findReservationsInDateRange(
        organizationId,
        reservation.classroomId,
        reservation.date,
        reservation.date
      );

      const hasOtherReservation = reservations.some((other) => {
        if (other.id === reservation.id || other.status !== 'ACCEPTED') {
          return false;
        }

        if (other.startTimeMinutes !== null && other.endTimeMinutes !== null) {
          return intervalsOverlap(
            {
              startMinutes: other.startTimeMinutes,
              endMinutes: other.endTimeMinutes,
            },
            {
              startMinutes: interval.startTimeMinutes,
              endMinutes: interval.endTimeMinutes,
            }
          );
        }

        return false;
      });

      if (hasOtherReservation) {
        throw new ValidationError(
          'No se puede aceptar la reserva porque el aula ya tiene otra reserva confirmada en esa fecha y hora.'
        );
      }

      reservation.accept();
    } else if (dto.status === 'REJECTED') {
      reservation.reject();
    }

    await this.repository.update(reservation);

    await this.notificationProvider.notifyReservationStatusChanged(
      reservation.requesterUserId,
      organizationId,
      dto.status,
      dto.status === 'ACCEPTED' ? 'aceptada' : 'rechazada'
    );

    return ClassroomReservationMapper.toDTO(reservation);
  }
}
