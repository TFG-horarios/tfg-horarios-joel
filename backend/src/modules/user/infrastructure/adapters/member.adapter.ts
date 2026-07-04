import type { IMemberProvider } from '../../domain/providers/member.provider';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';

export class MemberAdapter implements IMemberProvider {
  constructor(private readonly memberRepository: IMemberRepository) {}

  async getOrganizationsWhereUserIsSoleAdmin(
    userId: string
  ): Promise<string[]> {
    return this.memberRepository.getOrganizationsWhereUserIsSoleAdmin(userId);
  }
}
