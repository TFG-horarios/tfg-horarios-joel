import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { ISubjectMemberProvider } from '../domain/subject-member.provider';
import type { ISubjectRepository } from '../domain/subject.repository';

export class DeleteSubjectUseCase {
  constructor(
    private readonly subjectRepository: ISubjectRepository,
    private readonly memberProvider: ISubjectMemberProvider
  ) {}

  async execute(
    organizationId: string,
    subjectId: string,
    requesterUserId: string
  ): Promise<void> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'DELETE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to delete subjects in this organization.'
      );
    }

    const subject = await this.subjectRepository.findById(
      subjectId,
      organizationId
    );
    if (!subject) {
      throw new NotFoundError('Subject', subjectId);
    }

    await this.subjectRepository.delete(subjectId, organizationId);
  }
}
