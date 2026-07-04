export interface IDegreeAcademicYearProvider {
  shouldIncludeSoftDeleted(academicYearId: string): Promise<boolean>;
  findActiveAndFutureIds?(organizationId: string): Promise<string[]>;
}
