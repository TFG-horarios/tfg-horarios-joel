import type { IUserMemberProvider } from '../../domain/user-member.provider';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';

export class UserMemberAdapter implements IUserMemberProvider {
  constructor(private readonly memberRepository: IMemberRepository) {}

  async getOrganizationsWhereUserIsSoleAdmin(
    userId: string
  ): Promise<string[]> {
    return this.memberRepository.getOrganizationsWhereUserIsSoleAdmin(userId);
  }
}
