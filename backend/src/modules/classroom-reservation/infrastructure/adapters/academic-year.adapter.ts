import type { IAcademicYearProvider } from '../../domain/providers/academic-year.provider';
import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';

export class AcademicYearAdapter implements IAcademicYearProvider {
  constructor(
    private readonly academicYearRepository: IAcademicYearRepository
  ) {}

  async getMatchingPeriods(
    organizationId: string,
    academicYearId: string,
    date: Date
  ): Promise<number[] | null> {
    const academicYear =
      await this.academicYearRepository.findById(academicYearId);

    if (!academicYear || academicYear.organizationId !== organizationId) {
      return null;
    }

    return academicYear.getMatchingPeriods(date);
  }

  async getAcademicYear(
    organizationId: string,
    academicYearId: string
  ): Promise<any | null> {
    const academicYear =
      await this.academicYearRepository.findById(academicYearId);

    if (!academicYear || academicYear.organizationId !== organizationId) {
      return null;
    }

    return academicYear;
  }
}
