export interface IItineraryAcademicYearProvider {
  shouldIncludeSoftDeleted(academicYearId: string): Promise<boolean>;
}
