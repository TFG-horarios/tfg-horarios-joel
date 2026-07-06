import type {
  ClassroomReservationDTO,
  SaveClassroomReservationDTO,
} from '@tfg-horarios/shared';
import { ClassroomReservation } from '../domain/classroom-reservation.entity';
import type { IClassroomReservationRepository } from '../domain/classroom-reservation.repository';
import type { IScheduleProvider } from '../domain/providers/schedule.provider';
import type { IMemberProvider } from '../domain/providers/member.provider';
import type { IAcademicYearProvider } from '../domain/providers/academic-year.provider';
import type { INotificationProvider } from '../domain/providers/notification.provider';
import { ClassroomReservationMapper } from './classroom-reservation.mapper';
import {
  ForbiddenError,
  ValidationError,
  NotFoundError,
} from '@/core/errors/app.error';
import { ROLES } from '@/core/permissions/roles';
import { intervalsOverlap, parseTimeToMinutes } from '@tfg-horarios/shared';

export class RequestClassroomReservationUseCase {
  constructor(
    private readonly repository: IClassroomReservationRepository,
    private readonly scheduleProvider: IScheduleProvider,
    private readonly memberProvider: IMemberProvider,
    private readonly academicYearProvider: IAcademicYearProvider,
    private readonly notificationProvider: INotificationProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    dto: SaveClassroomReservationDTO
  ): Promise<ClassroomReservationDTO> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );

    if (!role) {
      throw new ForbiddenError(
        'You must be a member of the organization to request a reservation.'
      );
    }

    const reservationDate = new Date(dto.date);
    reservationDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reservationDate < today) {
      throw new ValidationError('No se pueden realizar reservas en el pasado.');
    }

    const academicYear = await this.academicYearProvider.getAcademicYear(
      organizationId,
      dto.academicYearId
    );

    if (!academicYear) {
      throw new NotFoundError('Academic year', dto.academicYearId);
    }

    const validStarts = [
      academicYear.period0Start,
      academicYear.period1Start,
      academicYear.period2Start,
    ].filter(Boolean) as string[];

    const validEnds = [
      academicYear.period0End,
      academicYear.period1End,
      academicYear.period2End,
    ].filter(Boolean) as string[];

    if (validStarts.length > 0 && validEnds.length > 0) {
      const minDate = new Date(
        Math.min(...validStarts.map((d) => new Date(d).getTime()))
      );
      const maxDate = new Date(
        Math.max(...validEnds.map((d) => new Date(d).getTime()))
      );

      if (reservationDate < minDate || reservationDate > maxDate) {
        throw new ValidationError(
          'La fecha seleccionada está fuera de los límites del curso académico.'
        );
      }
    }

    const matchingPeriods = academicYear.getMatchingPeriods(reservationDate);

    if (!matchingPeriods) {
      throw new NotFoundError('Academic year', dto.academicYearId);
    }

    const areSchedulesPublished =
      await this.scheduleProvider.areAllSchedulesPublished(
        organizationId,
        dto.academicYearId
      );

    if (!areSchedulesPublished) {
      throw new ValidationError('ERR_SCHEDULES_NOT_PUBLISHED');
    }

    const jsDay = reservationDate.getDay();
    const systemDayOfWeek = jsDay === 0 ? 7 : jsDay;

    if (dto.endTimeMinutes <= dto.startTimeMinutes) {
      throw new ValidationError(
        'La hora de fin de la reserva debe ser posterior a la hora de inicio.'
      );
    }

    const centerOpeningMinutes = parseTimeToMinutes(
      academicYear.centerOpeningTime
    );
    const centerClosingMinutes = parseTimeToMinutes(
      academicYear.centerClosingTime
    );

    if (
      dto.startTimeMinutes < centerOpeningMinutes ||
      dto.endTimeMinutes > centerClosingMinutes
    ) {
      throw new ValidationError(
        'La reserva debe estar dentro del horario de apertura del centro.'
      );
    }

    const slotIndex = Math.max(
      0,
      Math.floor(
        (dto.startTimeMinutes - centerOpeningMinutes) /
          academicYear.slotDurationMinutes
      )
    );

    const hasSubject = await this.scheduleProvider.hasSubjectInInterval(
      organizationId,
      dto.academicYearId,
      matchingPeriods,
      dto.classroomId,
      systemDayOfWeek,
      dto.startTimeMinutes,
      dto.endTimeMinutes
    );

    if (hasSubject) {
      throw new ValidationError(
        'El aula está ocupada por una asignatura en esa fecha y hora.'
      );
    }

    const reservations = await this.repository.findReservationsInDateRange(
      organizationId,
      dto.classroomId,
      dto.date,
      dto.date
    );

    const hasReservation = reservations.some((reservation) => {
      if (reservation.status !== 'ACCEPTED') return false;

      if (
        reservation.startTimeMinutes !== null &&
        reservation.endTimeMinutes !== null
      ) {
        return intervalsOverlap(
          {
            startMinutes: reservation.startTimeMinutes,
            endMinutes: reservation.endTimeMinutes,
          },
          {
            startMinutes: dto.startTimeMinutes,
            endMinutes: dto.endTimeMinutes,
          }
        );
      }

      return false;
    });

    if (hasReservation) {
      throw new ValidationError(
        'This classroom is already reserved at this time.'
      );
    }

    const isAdminOrEditor = role === ROLES.ADMIN || role === ROLES.EDITOR;

    const reservation = ClassroomReservation.create({
      organizationId,
      requesterUserId,
      classroomId: dto.classroomId,
      academicYearId: dto.academicYearId,
      date: dto.date,
      slotIndex,
      startTimeMinutes: dto.startTimeMinutes,
      endTimeMinutes: dto.endTimeMinutes,
      reason: dto.reason,
    });

    if (isAdminOrEditor) {
      reservation.accept();
    }

    await this.repository.save(reservation);

    if (!isAdminOrEditor) {
      await this.notificationProvider.notifyReservationRequested(
        reservation.requesterUserId,
        organizationId
      );
    }

    return ClassroomReservationMapper.toDTO(reservation);
  }
}
