export interface IDegreeAcademicYearProvider {
  shouldIncludeSoftDeleted(academicYearId: string): Promise<boolean>;
}
