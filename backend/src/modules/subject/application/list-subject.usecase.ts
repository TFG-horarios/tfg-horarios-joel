import type { SubjectDTO } from '@tfg-horarios/shared';
import type { ISubjectRepository } from '../domain/subject.repository';
import { SubjectMapper } from './subject.mapper';
import { ForbiddenError } from '@/core/errors/app.error';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';

export class ListSubjectUseCase {
  constructor(
    private readonly subjectRepository: ISubjectRepository,
    private readonly memberRepository: IMemberRepository
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string
  ): Promise<SubjectDTO[]> {
    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (!requester)
      throw new ForbiddenError('You do not have access to this organization');

    const subjects = await this.subjectRepository.findAll(organizationId);
    return SubjectMapper.toDTOList(subjects);
  }
}
