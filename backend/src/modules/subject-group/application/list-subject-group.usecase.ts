import type { ISubjectGroupRepository } from '../domain/subject-group.repository';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import type { SubjectGroupDTO } from '@tfg-horarios/shared';
import { SubjectGroupMapper } from './subject-group.mapper';
import { ForbiddenError } from '@/core/errors/app.error';

export class ListSubjectGroupsUseCase {
  constructor(
    private readonly subjectGroupRepository: ISubjectGroupRepository,
    private readonly memberRepository: IMemberRepository
  ) {}

  async execute(
    organizationId: string,
    subjectId: string,
    requesterUserId: string
  ): Promise<SubjectGroupDTO[]> {
    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (!requester) {
      throw new ForbiddenError('You do not have access to this organization.');
    }

    const groups = await this.subjectGroupRepository.findAll(subjectId);
    return SubjectGroupMapper.toDTOList(groups);
  }
}
