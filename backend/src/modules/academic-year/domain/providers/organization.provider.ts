export interface IOrganizationProvider {
  organizationExists(organizationId: string): Promise<boolean>;
}
