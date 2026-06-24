import type { ISubjectGroupAcademicYearProvider } from '../../domain/providers/subject-group-academic-year.provider';
import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';

export class SubjectGroupAcademicYearAdapter implements ISubjectGroupAcademicYearProvider {
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
