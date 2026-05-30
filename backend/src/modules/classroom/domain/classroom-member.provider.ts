import type { AppRole } from '@/core/permissions/roles';

export interface IClassroomMemberProvider {
  getMemberRole(
    userId: string,
    organizationId: string
  ): Promise<AppRole | null>;
}
