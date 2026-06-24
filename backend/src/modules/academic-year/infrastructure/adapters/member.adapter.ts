import type { AppRole } from '@/core/permissions/roles';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import type { IMemberProvider } from '../../domain/providers/member.provider';

export class MemberAdapter implements IMemberProvider {
  constructor(private readonly memberRepository: IMemberRepository) {}

  async getMemberRole(
    userId: string,
    organizationId: string
  ): Promise<AppRole | null> {
    const member = await this.memberRepository.findByUserAndOrg(
      userId,
      organizationId
    );
    return member ? member.role : null;
  }
}
