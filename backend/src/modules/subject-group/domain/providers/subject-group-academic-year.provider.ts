export interface ISubjectGroupAcademicYearProvider {
  shouldIncludeSoftDeleted(academicYearId: string): Promise<boolean>;
}
