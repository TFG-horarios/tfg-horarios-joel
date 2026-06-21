import type { MemberDTO } from '@tfg-horarios/shared';
import type { IMemberRepository } from '../domain/member.repository';
import { ForbiddenError } from '@/core/errors/app.error';
import { MemberMapper } from './member.mapper';

export class GetMeMemberUseCase {
  constructor(private readonly memberRepository: IMemberRepository) {}

  async execute(
    organizationId: string,
    requesterUserId: string
  ): Promise<MemberDTO> {
    const requester =
      await this.memberRepository.findWithUserDetailsByUserAndOrg(
        requesterUserId,
        organizationId
      );
    if (!requester) {
      throw new ForbiddenError('You do not belong to this organization.');
    }

    return MemberMapper.toDTO(
      requester.member,
      requester.userName,
      requester.userEmail
    );
  }
}
