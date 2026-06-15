import type { IClassroomReservationAcademicYearProvider } from '../../domain/classroom-reservation-academic-year.provider';
import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';

export class ClassroomReservationAcademicYearAdapter implements IClassroomReservationAcademicYearProvider {
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
}
