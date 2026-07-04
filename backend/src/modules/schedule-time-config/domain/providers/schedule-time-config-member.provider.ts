import type { AppRole } from '@/core/permissions/roles';

export interface IScheduleTimeConfigMemberProvider {
  getMemberRole(
    userId: string,
    organizationId: string
  ): Promise<AppRole | null>;
}
