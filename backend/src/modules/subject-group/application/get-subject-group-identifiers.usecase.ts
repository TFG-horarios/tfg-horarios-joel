import type { ISubjectGroupRepository } from '../domain/subject-group.repository';
import type { ISubjectGroupMemberProvider } from '../domain/subject-group-member.provider';
import { ForbiddenError } from '@/core/errors/app.error';
import type { AppRole } from '@/core/permissions/roles';
import type { SubjectGroupIdentifierDTO } from '@tfg-horarios/shared';

export class GetSubjectGroupIdentifiersUseCase {
  constructor(
    private readonly subjectGroupRepository: ISubjectGroupRepository,
    private readonly memberProvider: ISubjectGroupMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string
  ): Promise<SubjectGroupIdentifierDTO[]> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    return this.subjectGroupRepository.findIdentifiers(organizationId);
  }
}
