import type { SubjectDTO, SubjectListQueryDTO } from '@tfg-horarios/shared';
import type { ISubjectRepository } from '../domain/subject.repository';
import { SubjectMapper } from './subject.mapper';
import { ForbiddenError } from '@/core/errors/app.error';
import type { ISubjectMemberProvider } from '../domain/subject-member.provider';

export class ListSubjectUseCase {
  constructor(
    private readonly subjectRepository: ISubjectRepository,
    private readonly memberProvider: ISubjectMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    filters?: SubjectListQueryDTO
  ): Promise<SubjectDTO[]> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role)
      throw new ForbiddenError('You do not have access to this organization');

    const subjects = await this.subjectRepository.findAll(
      organizationId,
      filters
    );
    return SubjectMapper.toDTOList(subjects);
  }
}
