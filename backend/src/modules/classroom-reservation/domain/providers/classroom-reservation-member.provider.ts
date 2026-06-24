import type { AppRole } from '@/core/permissions/roles';

export interface IClassroomReservationMemberProvider {
  getMemberRole(
    userId: string,
    organizationId: string
  ): Promise<AppRole | null>;
}
