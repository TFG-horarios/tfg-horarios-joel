import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';
import type { IScheduleTimeConfigAcademicYearProvider } from '../../domain/providers/schedule-time-config-academic-year.provider';

export class ScheduleTimeConfigAcademicYearAdapter implements IScheduleTimeConfigAcademicYearProvider {
  constructor(
    private readonly academicYearRepository: IAcademicYearRepository
  ) {}

  async getTiming(academicYearId: string) {
    const academicYear =
      await this.academicYearRepository.findById(academicYearId);
    if (!academicYear) return null;
    return {
      organizationId: academicYear.organizationId,
      centerOpeningTime: academicYear.centerOpeningTime,
      centerClosingTime: academicYear.centerClosingTime,
      slotDurationMinutes: academicYear.slotDurationMinutes,
      breakDurationMinutes: academicYear.breakDurationMinutes,
    };
  }
}
