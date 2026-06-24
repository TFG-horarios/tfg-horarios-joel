import type { IAcademicYearProvider } from '../../domain/providers/academic-year.provider';
import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';

export class AcademicYearAdapter implements IAcademicYearProvider {
  constructor(
    private readonly academicYearRepository: IAcademicYearRepository
  ) {}

  async shouldIncludeSoftDeleted(academicYearId: string): Promise<boolean> {
    if (!academicYearId) return false;
    const isHistoric =
      await this.academicYearRepository.isHistoric(academicYearId);
    return isHistoric;
  }
}
