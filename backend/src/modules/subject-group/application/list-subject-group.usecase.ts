import type { ISubjectGroupRepository } from '../domain/subject-group.repository';
import type { ISubjectGroupMemberProvider } from '../domain/subject-group-member.provider';
import type { SubjectGroupDTO } from '@tfg-horarios/shared';
import { SubjectGroupMapper } from './subject-group.mapper';
import { ForbiddenError } from '@/core/errors/app.error';

export class ListSubjectGroupsUseCase {
  constructor(
    private readonly subjectGroupRepository: ISubjectGroupRepository,
    private readonly memberProvider: ISubjectGroupMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string
  ): Promise<SubjectGroupDTO[]> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization.');
    }

    const groups = await this.subjectGroupRepository.findAll(organizationId);
    return SubjectGroupMapper.toDTOList(groups);
  }
}
