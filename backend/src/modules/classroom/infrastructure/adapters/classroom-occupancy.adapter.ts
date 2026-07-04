import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';
import type { IScheduleRepository } from '@/modules/schedule/domain/schedule.repository';
import type { IScheduleSlotRepository } from '@/modules/schedule-slot/domain/schedule-slot.repository';
import type { IScheduleTimeConfigRepository } from '@/modules/schedule-time-config/domain/schedule-time-config.repository';
import type {
  ClassroomOccupancySchedule,
  IClassroomOccupancyProvider,
} from '../../domain/providers/classroom-occupancy.provider';
import type { ClassroomScheduleQueryDTO } from '@tfg-horarios/shared';

export class ClassroomOccupancyAdapter implements IClassroomOccupancyProvider {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly scheduleSlotRepository: IScheduleSlotRepository,
    private readonly scheduleTimeConfigRepository: IScheduleTimeConfigRepository,
    private readonly academicYearRepository: IAcademicYearRepository
  ) {}

  async findOccupancySchedules(
    organizationId: string,
    filters?: ClassroomScheduleQueryDTO
  ): Promise<ClassroomOccupancySchedule[]> {
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

    const occupancySchedules: ClassroomOccupancySchedule[] = [];
    for (const schedule of schedules) {
      if (!schedule.timeConfigId) continue;

      const [academicYear, timeConfig, slots] = await Promise.all([
        this.academicYearRepository.findById(schedule.academicYearId),
        this.scheduleTimeConfigRepository.findById(schedule.timeConfigId),
        this.scheduleSlotRepository.findByScheduleId(schedule.id),
      ]);

      if (
        !academicYear ||
        academicYear.organizationId !== organizationId ||
        !timeConfig
      ) {
        continue;
      }

      occupancySchedules.push({
        id: schedule.id,
        academicYear: {
          slotDurationMinutes: academicYear.slotDurationMinutes,
          breakDurationMinutes: academicYear.breakDurationMinutes,
        },
        timeConfig: {
          startTime: timeConfig.startTime,
          endTime: timeConfig.endTime,
          hasBreak: timeConfig.hasBreak,
          breakAfterSlot: timeConfig.breakAfterSlot,
        },
        period: schedule.period,
        shift: schedule.shift,
        slots: slots.map((slot) => ({
          id: slot.id,
          classroomId: slot.classroomId,
          subjectGroupId: slot.subjectGroupId,
          dayOfWeek: slot.dayOfWeek,
          slotIndex: slot.slotIndex,
          duration: slot.duration,
        })),
      });
    }

    return occupancySchedules;
  }
}
