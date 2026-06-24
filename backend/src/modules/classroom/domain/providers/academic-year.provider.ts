export interface IAcademicYearProvider {
  shouldIncludeSoftDeleted(academicYearId: string): Promise<boolean>;
}
