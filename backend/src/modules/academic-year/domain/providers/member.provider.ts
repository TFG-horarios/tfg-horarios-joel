import type { AppRole } from '@/core/permissions/roles';

export interface IMemberProvider {
  getMemberRole(
    userId: string,
    organizationId: string
  ): Promise<AppRole | null>;
}
