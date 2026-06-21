import type {
  ClassroomReservationDTO,
  SaveClassroomReservationDTO,
} from '@tfg-horarios/shared';
import { ClassroomReservation } from '../domain/classroom-reservation.entity';
import type { IClassroomReservationRepository } from '../domain/classroom-reservation.repository';
import type { IClassroomReservationScheduleProvider } from '../domain/classroom-reservation-schedule.provider';
import type { IClassroomReservationMemberProvider } from '../domain/classroom-reservation-member.provider';
import type { IClassroomReservationAcademicYearProvider } from '../domain/classroom-reservation-academic-year.provider';
import type { IClassroomReservationNotificationProvider } from '../domain/classroom-reservation-notification.provider';
import { ClassroomReservationMapper } from './classroom-reservation.mapper';
import {
  ForbiddenError,
  ValidationError,
  NotFoundError,
} from '@/core/errors/app.error';
import { ROLES } from '@/core/permissions/roles';

export class RequestClassroomReservationUseCase {
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
      throw new ValidationError(
        'No se pueden realizar reservas hasta que todos los horarios del curso estén generados y publicados.'
      );
    }

    const jsDay = reservationDate.getUTCDay();
    const systemDayOfWeek = jsDay === 0 ? 7 : jsDay;

    const hasSubject = await this.scheduleProvider.hasSubjectInSlot(
      organizationId,
      dto.academicYearId,
      matchingPeriods,
      dto.classroomId,
      systemDayOfWeek,
      dto.slotIndex
    );

    if (hasSubject) {
      throw new ValidationError(
        'El aula está ocupada por una asignatura en esa fecha y hora.'
      );
    }

    const hasReservation = await this.repository.hasAcceptedReservationOnDate(
      organizationId,
      dto.classroomId,
      dto.date,
      dto.slotIndex
    );

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
      slotIndex: dto.slotIndex,
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
