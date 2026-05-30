import type { ISubjectGroupRepository } from '../domain/subject-group.repository';
import type { ISubjectGroupMemberProvider } from '../domain/subject-group-member.provider';
import type { SubjectGroupDTO } from '@tfg-horarios/shared';
import { SubjectGroupMapper } from './subject-group.mapper';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

export class GetSubjectGroupUseCase {
  constructor(
    private readonly subjectGroupRepository: ISubjectGroupRepository,
    private readonly memberProvider: ISubjectGroupMemberProvider
  ) {}

  async execute(
    organizationId: string,
    id: string,
    requesterUserId: string
  ): Promise<SubjectGroupDTO> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization.');
    }

    const group = await this.subjectGroupRepository.findById(
      id,
      organizationId
    );

    if (!group) {
      throw new NotFoundError('SubjectGroup', id);
    }

    return SubjectGroupMapper.toDTO(group);
  }
}
