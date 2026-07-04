import type { AppRole } from '@/core/permissions/roles';
import type { IMemberRepository } from '../../domain/member.repository';

export class MemberRoleAdapter {
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
