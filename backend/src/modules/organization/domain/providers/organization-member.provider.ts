import type { AppRole } from '@/core/permissions/roles';

export interface IOrganizationMemberProvider {
  getMemberRole(
    userId: string,
    organizationId: string
  ): Promise<AppRole | null>;
}
