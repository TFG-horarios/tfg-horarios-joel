export interface ISubjectAcademicYearProvider {
  shouldIncludeSoftDeleted(academicYearId: string): Promise<boolean>;
  findActiveAndFutureIds?(organizationId: string): Promise<string[]>;
}
