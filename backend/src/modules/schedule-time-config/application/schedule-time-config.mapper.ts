import type { ScheduleTimeConfigDTO } from '@tfg-horarios/shared';
import type { ScheduleTimeConfig } from '../domain/schedule-time-config.entity';

export const toScheduleTimeConfigDTO = (
  config: ScheduleTimeConfig
): ScheduleTimeConfigDTO => ({
  id: config.id,
  organizationId: config.organizationId,
  academicYearId: config.academicYearId,
  degreeId: config.degreeId,
  itineraryId: config.itineraryId,
  courseYear: config.courseYear,
  period: config.period,
  shift: config.shift,
  startTime: config.startTime,
  endTime: config.endTime,
  hasBreak: config.hasBreak,
  breakAfterSlot: config.breakAfterSlot,
  createdAt: config.createdAt.toISOString(),
  updatedAt: config.updatedAt.toISOString(),
});
