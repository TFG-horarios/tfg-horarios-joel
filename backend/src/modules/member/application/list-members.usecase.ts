import type {
  MemberDTO,
  MemberListQueryDTO,
  PaginatedResponse,
} from '@tfg-horarios/shared';
import type { IMemberRepository } from '../domain/member.repository';
import { ForbiddenError } from '@/core/errors/app.error';
import { MemberMapper } from './member.mapper';
import { hasPermission } from '@/core/permissions/authorization';

export class ListMembersUseCase {
  constructor(private readonly memberRepository: IMemberRepository) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    filters?: MemberListQueryDTO
  ): Promise<PaginatedResponse<MemberDTO>> {
    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (!requester) {
      throw new ForbiddenError('You do not belong to this organization.');
    }
    if (!hasPermission(requester.role, 'VIEW_MEMBER')) {
      throw new ForbiddenError('You do not have permission to view members.');
    }
    const { data, meta } = await this.memberRepository.findPaginated(
      organizationId,
      filters
    );
    return {
      data: MemberMapper.toDTOList(data),
      meta,
    };
  }
}
