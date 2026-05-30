import type { AppRole } from '@/core/permissions/roles';

export interface IScheduleMemberProvider {
  getMemberRole(
    userId: string,
    organizationId: string
  ): Promise<AppRole | null>;
}
