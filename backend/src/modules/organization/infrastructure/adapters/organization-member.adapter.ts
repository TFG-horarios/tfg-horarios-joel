import type { IOrganizationMemberProvider } from '../../domain/organization-member.provider';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import type { AppRole } from '@/core/permissions/roles';

export class OrganizationMemberAdapter implements IOrganizationMemberProvider {
  constructor(private readonly memberRepository: IMemberRepository) {}

  async getMemberRole(
    userId: string,
    organizationId: string
  ): Promise<AppRole | null> {
    const member = await this.memberRepository.findByUserAndOrg(
      userId,
      organizationId
    );
    if (!member) return null;
    return member.role as AppRole;
  }
}
