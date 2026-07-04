export interface ISubjectGroupAcademicYearProvider {
  shouldIncludeSoftDeleted(academicYearId: string): Promise<boolean>;
  findActiveAndFutureIds?(organizationId: string): Promise<string[]>;
}
