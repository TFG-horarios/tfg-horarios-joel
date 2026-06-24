import type { ISubjectRepository } from '../domain/subject.repository';
import type { ISubjectMemberProvider } from '../domain/providers/subject-member.provider';
import type { SubjectDTO } from '@tfg-horarios/shared';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { SubjectMapper } from './subject.mapper';

export class GetSubjectUseCase {
  constructor(
    private readonly subjectRepository: ISubjectRepository,
    private readonly memberProvider: ISubjectMemberProvider
  ) {}

  async execute(
    organizationId: string,
    subjectId: string,
    requesterUserId: string
  ): Promise<SubjectDTO> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    const subject = await this.subjectRepository.findById(
      subjectId,
      organizationId
    );
    if (!subject) {
      throw new NotFoundError('Subject', subjectId);
    }

    return SubjectMapper.toDTO(subject);
  }
}
