import type { ISubjectGroupRepository } from '../domain/subject-group.repository';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import type { SubjectGroupDTO } from '@tfg-horarios/shared';
import { SubjectGroupMapper } from './subject-group.mapper';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

export class GetSubjectGroupUseCase {
  constructor(
    private readonly subjectGroupRepository: ISubjectGroupRepository,
    private readonly memberRepository: IMemberRepository
  ) {}

  async execute(
    organizationId: string,
    subjectId: string,
    id: string,
    requesterUserId: string
  ): Promise<SubjectGroupDTO> {
    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (!requester) {
      throw new ForbiddenError('You do not have access to this organization.');
    }

    const group = await this.subjectGroupRepository.findById(id);

    if (
      !group ||
      group.organizationId !== organizationId ||
      group.subjectId !== subjectId
    ) {
      throw new NotFoundError('SubjectGroup', id);
    }

    return SubjectGroupMapper.toDTO(group);
  }
}
