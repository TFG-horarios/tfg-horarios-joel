import type { IClassroomRepository } from '../domain/classroom.repository';
import type { IMemberProvider } from '../domain/providers/member.provider';
import type { IAcademicYearProvider } from '../domain/providers/academic-year.provider';
import type { IScheduleRepository } from '@/modules/schedule/domain/schedule.repository';
import type { IScheduleSlotRepository } from '@/modules/schedule-slot/domain/schedule-slot.repository';
import type { IScheduleTimeConfigRepository } from '@/modules/schedule-time-config/domain/schedule-time-config.repository';
import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';
import {
  buildScheduleTimeGrid,
  projectAssignmentInterval,
  type ClassroomOccupancyEventDTO,
  type ClassroomScheduleQueryDTO,
} from '@tfg-horarios/shared';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

export class GetClassroomOccupancyUseCase {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly scheduleSlotRepository: IScheduleSlotRepository,
    private readonly scheduleTimeConfigRepository: IScheduleTimeConfigRepository,
    private readonly academicYearRepository: IAcademicYearRepository,
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

    const schedules = (await this.scheduleRepository.findAll(organizationId))
      .filter((schedule) =>
        filters?.academicYearId
          ? schedule.academicYearId === filters.academicYearId
          : true
      )
      .filter((schedule) =>
        filters?.shift ? schedule.shift === filters.shift : true
      )
      .filter((schedule) =>
        filters?.period ? schedule.period === filters.period : true
      );

    const academicYearIds = [...new Set(schedules.map((s) => s.academicYearId))];
    const academicYearById = new Map<
      string,
      { slotDurationMinutes: number; breakDurationMinutes: number }
    >();

    for (const academicYearId of academicYearIds) {
      const academicYear =
        await this.academicYearRepository.findById(academicYearId);
      if (!academicYear || academicYear.organizationId !== organizationId) {
        continue;
      }
      academicYearById.set(academicYearId, {
        slotDurationMinutes: academicYear.slotDurationMinutes,
        breakDurationMinutes: academicYear.breakDurationMinutes,
      });
    }

    const timeConfigIds = [
      ...new Set(schedules.map((s) => s.timeConfigId).filter(Boolean)),
    ] as string[];
    const timeConfigById = new Map(
      (
        await Promise.all(
          timeConfigIds.map((id) =>
            this.scheduleTimeConfigRepository.findById(id)
          )
        )
      )
        .filter((config) => config !== null)
        .map((config) => [config.id, config])
    );

    const events: ClassroomOccupancyEventDTO[] = [];

    for (const schedule of schedules) {
      if (!schedule.timeConfigId) continue;
      const timeConfig = timeConfigById.get(schedule.timeConfigId);
      const academicYear = academicYearById.get(schedule.academicYearId);
      if (!timeConfig || !academicYear) continue;

      const grid = buildScheduleTimeGrid(
        {
          slotDurationMinutes: academicYear.slotDurationMinutes,
          breakDurationMinutes: academicYear.breakDurationMinutes,
        },
        {
          startTime: timeConfig.startTime,
          endTime: timeConfig.endTime,
          hasBreak: timeConfig.hasBreak,
          breakAfterSlot: timeConfig.breakAfterSlot,
        }
      );

      const slots = await this.scheduleSlotRepository.findByScheduleId(
        schedule.id
      );
      for (const slot of slots) {
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
