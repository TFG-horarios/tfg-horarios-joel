export interface INotificationProvider {
  notifyAddedToOrganization(
    userId: string,
    organizationId: string
  ): Promise<void>;

  notifyRoleUpdated(
    userId: string,
    organizationId: string,
    roleName: string
  ): Promise<void>;

  notifyRemovedFromOrganization(
    userId: string,
    organizationId: string
  ): Promise<void>;
}
