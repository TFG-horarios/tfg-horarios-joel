import type { AppRole } from '@/core/permissions/roles';

export interface IAcademicYearMemberProvider {
  getMemberRole(
    userId: string,
    organizationId: string
  ): Promise<AppRole | null>;
}
