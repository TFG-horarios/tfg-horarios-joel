export interface IAcademicYearProvider {
  shouldIncludeSoftDeleted(academicYearId: string): Promise<boolean>;
  findActiveAndFutureIds?(organizationId: string): Promise<string[]>;
}
