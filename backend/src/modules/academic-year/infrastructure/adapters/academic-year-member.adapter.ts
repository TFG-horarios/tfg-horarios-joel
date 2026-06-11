import type { AppRole } from '@/core/permissions/roles';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import type { IAcademicYearMemberProvider } from '../../domain/academic-year-member.provider';

export class AcademicYearMemberAdapter implements IAcademicYearMemberProvider {
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
