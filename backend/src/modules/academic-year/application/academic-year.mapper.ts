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
      periodType: academicYear.periodType,
      morningStart: academicYear.morningStart.slice(0, 5),
      morningEnd: academicYear.morningEnd.slice(0, 5),
      afternoonStart: academicYear.afternoonStart.slice(0, 5),
      afternoonEnd: academicYear.afternoonEnd.slice(0, 5),
      slotDurationMinutes: academicYear.slotDurationMinutes,
      createdAt: academicYear.createdAt.toISOString(),
      updatedAt: academicYear.updatedAt.toISOString(),
    };
  }

  static toDTOList(academicYears: AcademicYear[]): AcademicYearDTO[] {
    return academicYears.map((ay) => this.toDTO(ay));
  }
}
