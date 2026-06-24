import type { AppRole } from '@/core/permissions/roles';

export interface IDegreeMemberProvider {
  getMemberRole(
    userId: string,
    organizationId: string
  ): Promise<AppRole | null>;
}
