import type { IScheduleProvider } from '../../domain/providers/schedule.provider';
import type { IScheduleRepository } from '@/modules/schedule/domain/schedule.repository';
import type { IScheduleSlotRepository } from '@/modules/schedule-slot/domain/schedule-slot.repository';
import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';
import type { IScheduleTimeConfigRepository } from '@/modules/schedule-time-config/domain/schedule-time-config.repository';
import {
  buildScheduleTimeGrid,
  intervalsOverlap,
  projectAssignmentInterval,
} from '@tfg-horarios/shared';

export class ScheduleAdapter implements IScheduleProvider {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly scheduleSlotRepository: IScheduleSlotRepository,
    private readonly academicYearRepository: IAcademicYearRepository,
    private readonly scheduleTimeConfigRepository: IScheduleTimeConfigRepository
  ) {}

  private async projectSlotInterval(
    organizationId: string,
    academicYearId: string,
    scheduleTimeConfigId: string,
    slotIndex: number,
    duration = 1
  ): Promise<{
    startTimeMinutes: number;
    endTimeMinutes: number;
  } | null> {
    const academicYear =
      await this.academicYearRepository.findById(academicYearId);
    if (!academicYear || academicYear.organizationId !== organizationId) {
      return null;
    }

    const config =
      await this.scheduleTimeConfigRepository.findById(scheduleTimeConfigId);
    if (
      !config ||
      config.organizationId !== organizationId ||
      config.academicYearId !== academicYearId
    ) {
      return null;
    }

    const grid = buildScheduleTimeGrid(
      {
        slotDurationMinutes: academicYear.slotDurationMinutes,
        breakDurationMinutes: academicYear.breakDurationMinutes,
      },
      {
        startTime: config.startTime,
        endTime: config.endTime,
        hasBreak: config.hasBreak,
        breakAfterSlot: config.breakAfterSlot,
      }
    );
    const interval = projectAssignmentInterval(grid, slotIndex, duration);

    if (!interval) return null;

    return {
      startTimeMinutes: interval.startMinutes,
      endTimeMinutes: interval.endMinutes,
    };
  }

  async hasSubjectInInterval(
    organizationId: string,
    academicYearId: string,
    periods: number[],
    classroomId: string,
    dayOfWeek: number,
    startTimeMinutes: number,
    endTimeMinutes: number
  ): Promise<boolean> {
    const schedules = await this.scheduleRepository.findAll(organizationId);
    const yearSchedules = schedules.filter(
      (s) => s.academicYearId === academicYearId && periods.includes(s.period)
    );
    if (yearSchedules.length === 0) return false;

    for (const schedule of yearSchedules) {
      const slots = await this.scheduleSlotRepository.findByScheduleId(
        schedule.id
      );
      for (const s of slots) {
        if (
          s.classroomId !== classroomId ||
          s.dayOfWeek !== dayOfWeek ||
          s.slotIndex === null ||
          schedule.timeConfigId === null
        ) {
          continue;
        }

        const interval = await this.projectSlotInterval(
          organizationId,
          academicYearId,
          schedule.timeConfigId,
          s.slotIndex,
          s.duration
        );

        if (
          interval &&
          intervalsOverlap(
            {
              startMinutes: interval.startTimeMinutes,
              endMinutes: interval.endTimeMinutes,
            },
            { startMinutes: startTimeMinutes, endMinutes: endTimeMinutes }
          )
        ) {
          return true;
        }
      }
    }

    return false;
  }

  async areAllSchedulesPublished(
    organizationId: string,
    academicYearId: string
  ): Promise<boolean> {
    const schedules = await this.scheduleRepository.findAll(organizationId);
    const yearSchedules = schedules.filter(
      (s) => s.academicYearId === academicYearId
    );

    if (yearSchedules.length === 0) return false;

    return yearSchedules.every((s) => s.status === 'published');
  }

  async getClassroomScheduleSlots(
    organizationId: string,
    academicYearId: string,
    classroomId: string
  ): Promise<
    {
      dayOfWeek: number;
      slotIndex: number;
      duration: number;
      period: number;
      startTimeMinutes: number;
      endTimeMinutes: number;
    }[]
  > {
    const schedules = await this.scheduleRepository.findAll(organizationId);
    const yearSchedules = schedules.filter(
      (s) => s.academicYearId === academicYearId
    );

    const scheduleSlots = [];
    for (const schedule of yearSchedules) {
      const slots = await this.scheduleSlotRepository.findByScheduleId(
        schedule.id
      );
      const classroomSlots = slots.filter(
        (s) =>
          s.classroomId === classroomId &&
          s.slotIndex !== null &&
          s.dayOfWeek !== null
      );
      for (const slot of classroomSlots) {
        if (!schedule.timeConfigId || slot.slotIndex === null) {
          continue;
        }

        const interval = await this.projectSlotInterval(
          organizationId,
          academicYearId,
          schedule.timeConfigId,
          slot.slotIndex,
          slot.duration
        );

        if (!interval) {
          continue;
        }

        scheduleSlots.push({
          dayOfWeek: slot.dayOfWeek as number,
          slotIndex: slot.slotIndex as number,
          duration: slot.duration,
          period: schedule.period,
          startTimeMinutes: interval.startTimeMinutes,
          endTimeMinutes: interval.endTimeMinutes,
        });
      }
    }
    return scheduleSlots;
  }
}
