import type { AppRole } from '@/core/permissions/roles';

export interface ISubjectGroupMemberProvider {
  getMemberRole(
    userId: string,
    organizationId: string
  ): Promise<AppRole | null>;
}
