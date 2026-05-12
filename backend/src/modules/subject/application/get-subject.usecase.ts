import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import type { ISubjectRepository } from '../domain/subject.repository';
import type { SubjectDTO } from '@tfg-horarios/shared';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { SubjectMapper } from './subject.mapper';

export class GetSubjectUseCase {
  constructor(
    private readonly subjectRepository: ISubjectRepository,
    private readonly memberRepository: IMemberRepository
  ) {}

  async execute(
    organizationId: string,
    degreeId: string,
    subjectId: string,
    requesterUserId: string
  ): Promise<SubjectDTO> {
    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (!requester) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    const subject = await this.subjectRepository.findById(subjectId);
    if (
      !subject ||
      subject.organizationId !== organizationId ||
      subject.degreeId !== degreeId
    ) {
      throw new NotFoundError('Subject', subjectId);
    }

    return SubjectMapper.toDTO(subject);
  }
}
