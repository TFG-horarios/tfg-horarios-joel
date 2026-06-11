import { AcademicYear } from '../domain/academic-year.entity';
import type { AcademicYearDTO } from '@tfg-horarios/shared';

export class AcademicYearMapper {
  static toDTO(academicYear: AcademicYear): AcademicYearDTO {
    return {
      id: academicYear.id,
      organizationId: academicYear.organizationId,
      name: academicYear.name,
      isActive: academicYear.isActive,
      period0Start: academicYear.period0Start,
      period0End: academicYear.period0End,
      period1Start: academicYear.period1Start,
      period1End: academicYear.period1End,
      period2Start: academicYear.period2Start,
      period2End: academicYear.period2End,
      period3Start: academicYear.period3Start,
      period3End: academicYear.period3End,
      createdAt: academicYear.createdAt.toISOString(),
      updatedAt: academicYear.updatedAt.toISOString(),
    };
  }

  static toDTOList(academicYears: AcademicYear[]): AcademicYearDTO[] {
    return academicYears.map((ay) => this.toDTO(ay));
  }
}
