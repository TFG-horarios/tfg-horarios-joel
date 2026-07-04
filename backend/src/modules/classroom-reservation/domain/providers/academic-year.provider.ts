export interface IAcademicYearProvider {
  getMatchingPeriods(
    organizationId: string,
    academicYearId: string,
    date: Date
  ): Promise<number[] | null>;
  getAcademicYear(
    organizationId: string,
    academicYearId: string
  ): Promise<any | null>;
}
