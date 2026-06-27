import type {
  IScheduleDataProvider,
  ScheduleOrganizationConstraints,
  ScheduleClassroomData,
} from '../../domain/providers/schedule-data.provider';
import type { ClassroomType } from '@tfg-horarios/shared';
import type { IDegreeRepository } from '@/modules/degree/domain/degree.repository';
import type { IClassroomRepository } from '@/modules/classroom/domain/classroom.repository';
import type { ISubjectGroupRepository } from '@/modules/subject-group/domain/subject-group.repository';
import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';
import type { ScheduleEngineGroupData } from '../../domain/providers/schedule-engine.provider';
import type { IClassroomReservationRepository } from '@/modules/classroom-reservation/domain/classroom-reservation.repository';
import type { CreateNotificationUseCase } from '@/modules/notification/application/create-notification.usecase';
import type { IScheduleTimeConfigRepository } from '@/modules/schedule-time-config/domain/schedule-time-config.repository';

export class ScheduleDataAdapter implements IScheduleDataProvider {
  constructor(
    private readonly degreeRepository: IDegreeRepository,
    private readonly classroomRepository: IClassroomRepository,
    private readonly subjectGroupRepository: ISubjectGroupRepository,
    private readonly academicYearRepository: IAcademicYearRepository,
    private readonly reservationRepository: IClassroomReservationRepository,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
    private readonly scheduleTimeConfigRepository?: IScheduleTimeConfigRepository
  ) {}

  async getTargetDegreeIds(organizationId: string): Promise<string[]> {
    const degrees = await this.degreeRepository.findAll(organizationId, false);
    return degrees.map((d) => d.id);
  }

  async getAvailableClassrooms(
    organizationId: string
  ): Promise<ScheduleClassroomData[]> {
    const classrooms = await this.classroomRepository.findAll(
      organizationId,
      false
    );
    return classrooms.map((c) => ({
      id: c.id,
      capacity: c.capacity,
      type: c.type as ClassroomType,
      floor: c.floor,
    }));
  }

  async getGroupsInScope(
    organizationId: string,
    period: number,
    degreeIds: string[],
    itineraryIds?: string[],
    courseYears?: number[]
  ): Promise<ScheduleEngineGroupData[]> {
    const rows =
      await this.subjectGroupRepository.findGroupsWithSubjectsInScope(
        organizationId,
        period,
        degreeIds,
        itineraryIds,
        courseYears
      );

    return rows.map((r) => ({
      subjectGroupId: r.id,
      subjectId: r.subjectId,
      groupType: r.groupType,
      isCommon: r.isCommon,
      itineraryName: r.itineraryName,
      itineraryId: r.itineraryId,
      numberOfStudents: r.numberOfStudents,
      needsComputerLab: r.needsComputerLab,
      shift: r.shift,
      weeklyHours: r.weeklyHours,
      degreeId: r.degreeId,
      courseYear: r.courseYear,
    }));
  }

  async getAcademicYearConstraints(
    academicYearId: string
  ): Promise<ScheduleOrganizationConstraints | null> {
    const academicYear =
      await this.academicYearRepository.findById(academicYearId);
    if (!academicYear) return null;
    return {
      breakDurationMinutes: academicYear.breakDurationMinutes,
      centerOpeningTime: academicYear.centerOpeningTime,
      centerClosingTime: academicYear.centerClosingTime,
      slotDurationMinutes: academicYear.slotDurationMinutes,
    };
  }

  async getScheduleTimeConfigs(organizationId: string, academicYearId: string) {
    if (!this.scheduleTimeConfigRepository) return [];
    const configs = await this.scheduleTimeConfigRepository.findAll(
      organizationId,
      academicYearId
    );
    return configs.map((config) => ({
      id: config.id,
      degreeId: config.degreeId,
      itineraryId: config.itineraryId,
      courseYear: config.courseYear,
      period: config.period,
      shift: config.shift,
      startTime: config.startTime,
      endTime: config.endTime,
      hasBreak: config.hasBreak,
      breakAfterSlot: config.breakAfterSlot,
    }));
  }

  async rejectConflictingReservationsBatch(
    organizationId: string,
    academicYearId: string,
    slots: {
      classroomId: string;
      dayOfWeek: number;
      slotIndex: number;
      duration: number;
      period: number;
      timeConfigId?: string;
      startTimeMinutes?: number;
      endTimeMinutes?: number;
    }[]
  ): Promise<void> {
    if (slots.length === 0) return;

    const academicYear =
      await this.academicYearRepository.findById(academicYearId);
    if (!academicYear || academicYear.organizationId !== organizationId) return;

    const today = new Date().toISOString().split('T')[0]!;
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 2);
    const endStr = endDate.toISOString().split('T')[0]!;

    const uniqueClassroomIds = [...new Set(slots.map((s) => s.classroomId))];

    for (const classroomId of uniqueClassroomIds) {
      const allFutureReservations =
        await this.reservationRepository.findReservationsInDateRange(
          organizationId,
          classroomId,
          today,
          endStr
        );

      const classroomSlots = slots.filter((s) => s.classroomId === classroomId);

      for (const res of allFutureReservations) {
        if (
          res.status === 'REJECTED' ||
          res.status === 'CANCELLED' ||
          res.academicYearId !== academicYearId
        ) {
          continue;
        }

        const resDate = new Date(res.date);
        const resDow = resDate.getUTCDay();
        const matchingPeriods = academicYear.getMatchingPeriods(resDate);

        const hasConflict = classroomSlots.some((slot) => {
          if (
            matchingPeriods.includes(slot.period) &&
            resDow === slot.dayOfWeek
          ) {
            if (
              res.startTimeMinutes !== null &&
              res.endTimeMinutes !== null &&
              slot.startTimeMinutes !== undefined &&
              slot.endTimeMinutes !== undefined
            ) {
              return (
                slot.startTimeMinutes < res.endTimeMinutes &&
                res.startTimeMinutes < slot.endTimeMinutes
              );
            }
          }
          return false;
        });

        if (hasConflict) {
          res.reject(
            'Cancelada automáticamente por solapamiento con clase regular'
          );
          await this.reservationRepository.update(res);
          await this.createNotificationUseCase.execute({
            userId: res.requesterUserId,
            organizationId,
            title: 'Reserva cancelada automáticamente',
            message:
              'Tu reserva ha sido cancelada debido a un solapamiento con un horario regular generado.',
            type: 'ERROR',
          });
        }
      }
    }
  }

  async getMatchingPeriods(
    academicYearId: string,
    date: Date
  ): Promise<number[]> {
    const academicYear =
      await this.academicYearRepository.findById(academicYearId);
    return academicYear?.getMatchingPeriods(date) ?? [];
  }
}
