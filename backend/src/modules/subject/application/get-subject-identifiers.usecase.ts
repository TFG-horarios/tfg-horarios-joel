import type { ISubjectRepository } from '../domain/subject.repository';
import type { ISubjectMemberProvider } from '../domain/subject-member.provider';
import { ForbiddenError } from '@/core/errors/app.error';
import type { AppRole } from '@/core/permissions/roles';
import type { SubjectIdentifierDTO } from '@tfg-horarios/shared';

export class GetSubjectIdentifiersUseCase {
  constructor(
    private readonly subjectRepository: ISubjectRepository,
    private readonly memberProvider: ISubjectMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string
  ): Promise<SubjectIdentifierDTO[]> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    return this.subjectRepository.findIdentifiers(organizationId);
  }
}
