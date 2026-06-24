export interface ISubjectAcademicYearProvider {
  shouldIncludeSoftDeleted(academicYearId: string): Promise<boolean>;
}
