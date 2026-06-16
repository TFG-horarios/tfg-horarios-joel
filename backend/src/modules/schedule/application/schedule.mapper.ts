import type { ScheduleDTO } from '@tfg-horarios/shared';
import { Schedule } from '../domain/schedule.entity';

export class ScheduleMapper {
  public static toDTO(schedule: Schedule): ScheduleDTO {
    return {
      id: schedule.id,
      organizationId: schedule.organizationId,
      degreeId: schedule.degreeId,
      itineraryId: schedule.itineraryId ?? undefined,
      academicYearId: schedule.academicYearId,
      shift: schedule.shift,
      courseYear: schedule.courseYear,
      period: schedule.period,
      conflicts: schedule.conflicts,
      status: schedule.status,
      createdAt: schedule.createdAt.toISOString(),
      updatedAt: schedule.updatedAt.toISOString(),
    };
  }
}
