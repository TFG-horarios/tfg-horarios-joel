import type {
  ClassroomReservationDTO,
  SaveClassroomReservationDTO,
} from '@tfg-horarios/shared';
import { ClassroomReservation } from '../domain/classroom-reservation.entity';
import type { IClassroomReservationRepository } from '../domain/classroom-reservation.repository';
import type { IClassroomReservationScheduleProvider } from '../domain/classroom-reservation-schedule.provider';
import type { IClassroomReservationMemberProvider } from '../domain/classroom-reservation-member.provider';
import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';
import { ClassroomReservationMapper } from './classroom-reservation.mapper';
import {
  ForbiddenError,
  ValidationError,
  NotFoundError,
} from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';

export class RequestClassroomReservationUseCase {
  constructor(
    private readonly repository: IClassroomReservationRepository,
    private readonly scheduleProvider: IClassroomReservationScheduleProvider,
    private readonly memberProvider: IClassroomReservationMemberProvider,
    private readonly academicYearRepository: IAcademicYearRepository
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

    const academicYear = await this.academicYearRepository.findById(
      dto.academicYearId
    );
    if (!academicYear || academicYear.organizationId !== organizationId) {
      throw new NotFoundError('Academic year', organizationId);
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

    const reservationDate = new Date(dto.date);
    const jsDay = reservationDate.getDay();
    const systemDayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

    const matchingPeriods = academicYear.getMatchingPeriods(reservationDate);

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

    const isAdminOrEditor =
      role && hasPermission(role, 'UPDATE_ORGANIZATION_COMPONENTS');

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

    return ClassroomReservationMapper.toDTO(reservation);
  }
}
