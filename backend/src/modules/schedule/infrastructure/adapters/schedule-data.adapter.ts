import type {
  IScheduleDataProvider,
  ScheduleOrganizationConstraints,
  ScheduleClassroomData,
} from '../../domain/schedule-data.provider';
import type { ClassroomType } from '@tfg-horarios/shared';
import type { IDegreeRepository } from '@/modules/degree/domain/degree.repository';
import type { IClassroomRepository } from '@/modules/classroom/domain/classroom.repository';
import type { ISubjectGroupRepository } from '@/modules/subject-group/domain/subject-group.repository';
import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';
import type { ScheduleEngineGroupData } from '../../domain/schedule-engine.provider';
import type { IClassroomReservationRepository } from '@/modules/classroom-reservation/domain/classroom-reservation.repository';

export class ScheduleDataAdapter implements IScheduleDataProvider {
  constructor(
    private readonly degreeRepository: IDegreeRepository,
    private readonly classroomRepository: IClassroomRepository,
    private readonly subjectGroupRepository: ISubjectGroupRepository,
    private readonly academicYearRepository: IAcademicYearRepository,
    private readonly reservationRepository: IClassroomReservationRepository
  ) {}

  async getTargetDegreeIds(organizationId: string): Promise<string[]> {
    const degrees = await this.degreeRepository.findAll(organizationId);
    return degrees.map((d) => d.id);
  }

  async getAvailableClassrooms(
    organizationId: string
  ): Promise<ScheduleClassroomData[]> {
    const classrooms = await this.classroomRepository.findAll(organizationId);
    return classrooms.map((c) => ({
      id: c.id,
      capacity: c.capacity,
      type: c.type as ClassroomType,
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
      morningStart: academicYear.morningStart,
      morningEnd: academicYear.morningEnd,
      afternoonStart: academicYear.afternoonStart,
      afternoonEnd: academicYear.afternoonEnd,
      slotDurationMinutes: academicYear.slotDurationMinutes,
    };
  }

  async rejectConflictingReservationsBatch(
    organizationId: string,
    slots: {
      classroomId: string;
      dayOfWeek: number;
      slotIndex: number;
      duration: number;
    }[]
  ): Promise<void> {
    if (slots.length === 0) return;

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
        if (res.status === 'REJECTED') continue;

        const resDate = new Date(res.date);
        const resDow = resDate.getUTCDay();

        const hasConflict = classroomSlots.some((slot) => {
          if (resDow === slot.dayOfWeek) {
            const startSlot = slot.slotIndex;
            const endSlot = slot.slotIndex + Math.ceil(slot.duration) - 1;
            return res.slotIndex >= startSlot && res.slotIndex <= endSlot;
          }
          return false;
        });

        if (hasConflict) {
          res.reject(
            'Cancelada automáticamente por solapamiento con clase regular'
          );
          await this.reservationRepository.update(res);
        }
      }
    }
  }
}
