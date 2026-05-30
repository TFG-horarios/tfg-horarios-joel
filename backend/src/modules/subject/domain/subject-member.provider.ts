import type { AppRole } from '@/core/permissions/roles';

export interface ISubjectMemberProvider {
  getMemberRole(
    userId: string,
    organizationId: string
  ): Promise<AppRole | null>;
}
