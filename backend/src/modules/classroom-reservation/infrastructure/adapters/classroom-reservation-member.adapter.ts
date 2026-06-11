import type { AppRole } from '@/core/permissions/roles';
import type { IClassroomReservationMemberProvider } from '../../domain/classroom-reservation-member.provider';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';

export class ClassroomReservationMemberAdapter implements IClassroomReservationMemberProvider {
  constructor(private readonly memberRepository: IMemberRepository) {}

  async getMemberRole(
    userId: string,
    organizationId: string
  ): Promise<AppRole | null> {
    const member = await this.memberRepository.findByUserAndOrg(
      userId,
      organizationId
    );
    return member?.role ?? null;
  }
}
