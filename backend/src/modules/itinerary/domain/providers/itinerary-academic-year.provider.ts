export interface IItineraryAcademicYearProvider {
  shouldIncludeSoftDeleted(academicYearId: string): Promise<boolean>;
  findActiveAndFutureIds?(organizationId: string): Promise<string[]>;
}
