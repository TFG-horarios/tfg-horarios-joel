import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';
import type { IAcademicYearProvider } from '../../domain/providers/academic-year.provider';

export class AcademicYearAdapter implements IAcademicYearProvider {
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
