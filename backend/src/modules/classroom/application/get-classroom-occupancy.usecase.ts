import type { IClassroomRepository } from '../domain/classroom.repository';
import type { IMemberProvider } from '../domain/providers/member.provider';
import type { IAcademicYearProvider } from '../domain/providers/academic-year.provider';
import type { IClassroomOccupancyProvider } from '../domain/providers/classroom-occupancy.provider';
import {
  buildScheduleTimeGrid,
  projectAssignmentInterval,
  type ClassroomOccupancyEventDTO,
  type ClassroomScheduleQueryDTO,
} from '@tfg-horarios/shared';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

export class GetClassroomOccupancyUseCase {
  constructor(
    private readonly occupancyProvider: IClassroomOccupancyProvider,
    private readonly classroomRepository: IClassroomRepository,
    private readonly memberProvider: IMemberProvider,
    private readonly academicYearProvider: IAcademicYearProvider
  ) {}

  async execute(
    organizationId: string,
    classroomId: string,
    requesterUserId: string,
    filters?: ClassroomScheduleQueryDTO
  ): Promise<ClassroomOccupancyEventDTO[]> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    const includeSoftDeleted = filters?.academicYearId
      ? await this.academicYearProvider.shouldIncludeSoftDeleted(
          filters.academicYearId
        )
      : false;

    const classroom = await this.classroomRepository.findById(
      classroomId,
      organizationId,
      includeSoftDeleted
    );

    if (!classroom) {
      throw new NotFoundError('Classroom', classroomId);
    }

    const schedules = await this.occupancyProvider.findOccupancySchedules(
      organizationId,
      filters
    );

    const events: ClassroomOccupancyEventDTO[] = [];

    for (const schedule of schedules) {
      const grid = buildScheduleTimeGrid(
        {
          slotDurationMinutes: schedule.academicYear.slotDurationMinutes,
          breakDurationMinutes: schedule.academicYear.breakDurationMinutes,
        },
        {
          startTime: schedule.timeConfig.startTime,
          endTime: schedule.timeConfig.endTime,
          hasBreak: schedule.timeConfig.hasBreak,
          breakAfterSlot: schedule.timeConfig.breakAfterSlot,
        }
      );

      for (const slot of schedule.slots) {
        if (
          slot.classroomId !== classroomId ||
          slot.dayOfWeek === null ||
          slot.slotIndex === null
        ) {
          continue;
        }

        const interval = projectAssignmentInterval(
          grid,
          slot.slotIndex,
          slot.duration
        );
        if (!interval) continue;

        events.push({
          id: slot.id,
          type: 'class',
          classroomId,
          scheduleId: schedule.id,
          subjectGroupId: slot.subjectGroupId,
          dayOfWeek: slot.dayOfWeek,
          slotIndex: slot.slotIndex,
          duration: slot.duration,
          period: schedule.period,
          shift: schedule.shift,
          startTimeMinutes: interval.startMinutes,
          endTimeMinutes: interval.endMinutes,
        });
      }
    }

    return events.sort(
      (a, b) =>
        a.dayOfWeek - b.dayOfWeek ||
        a.startTimeMinutes - b.startTimeMinutes ||
        a.endTimeMinutes - b.endTimeMinutes
    );
  }
}
