export interface IClassroomReservationAcademicYearProvider {
  getMatchingPeriods(
    organizationId: string,
    academicYearId: string,
    date: Date
  ): Promise<number[] | null>;
}
