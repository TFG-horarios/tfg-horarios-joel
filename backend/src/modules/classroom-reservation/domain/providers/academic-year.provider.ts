import type { AcademicYearDTO } from '@tfg-horarios/shared';

export type ReservationAcademicYear = Pick<
  AcademicYearDTO,
  | 'organizationId'
  | 'period0Start'
  | 'period0End'
  | 'period1Start'
  | 'period1End'
  | 'period2Start'
  | 'period2End'
  | 'centerOpeningTime'
  | 'centerClosingTime'
  | 'slotDurationMinutes'
> & {
  getMatchingPeriods(date: Date): number[] | null;
};

export interface IAcademicYearProvider {
  getMatchingPeriods(
    organizationId: string,
    academicYearId: string,
    date: Date
  ): Promise<number[] | null>;
  getAcademicYear(
    organizationId: string,
    academicYearId: string
  ): Promise<ReservationAcademicYear | null>;
}
