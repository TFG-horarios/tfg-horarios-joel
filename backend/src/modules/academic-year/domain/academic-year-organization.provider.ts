export interface IAcademicYearOrganizationProvider {
  organizationExists(organizationId: string): Promise<boolean>;
}
