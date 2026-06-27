import type { ISubjectAcademicYearProvider } from '../../domain/providers/subject-academic-year.provider';
import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';

export class SubjectAcademicYearAdapter implements ISubjectAcademicYearProvider {
  constructor(
    private readonly academicYearRepository: IAcademicYearRepository
  ) {}

  async shouldIncludeSoftDeleted(academicYearId: string): Promise<boolean> {
    if (!academicYearId) return false;
    const isHistoric =
      (await this.academicYearRepository.isHistoric?.(academicYearId)) ?? false;
    return isHistoric;
  }
}
