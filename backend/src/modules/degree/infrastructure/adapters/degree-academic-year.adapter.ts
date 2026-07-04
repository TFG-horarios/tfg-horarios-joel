import type { IDegreeAcademicYearProvider } from '../../domain/providers/degree-academic-year.provider';
import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';

export class DegreeAcademicYearAdapter implements IDegreeAcademicYearProvider {
  constructor(
    private readonly academicYearRepository: IAcademicYearRepository
  ) {}

  async shouldIncludeSoftDeleted(academicYearId: string): Promise<boolean> {
    if (!academicYearId) return false;
    const isHistoric =
      (await this.academicYearRepository.isHistoric?.(academicYearId)) ?? false;
    return isHistoric;
  }

  findActiveAndFutureIds(organizationId: string): Promise<string[]> {
    return this.academicYearRepository.findActiveAndFutureIds!(organizationId);
  }
}
