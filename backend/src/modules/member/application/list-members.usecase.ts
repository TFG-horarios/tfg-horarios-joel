import type { MemberDTO, MemberListQueryDTO } from '@tfg-horarios/shared';
import type { IMemberRepository } from '../domain/member.repository';
import { ForbiddenError } from '@/core/errors/app.error';
import { MemberMapper } from './member.mapper';

export class ListMembersUseCase {
  constructor(private readonly memberRepository: IMemberRepository) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    filters?: MemberListQueryDTO
  ): Promise<MemberDTO[]> {
    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (!requester) {
      throw new ForbiddenError('You do not belong to this organization.');
    }
    const members = await this.memberRepository.findByOrganizationId(
      organizationId,
      filters
    );
    return MemberMapper.toDTOList(members);
  }
}
