import type { SubjectDTO } from '@tfg-horarios/shared';
import type { ISubjectRepository } from '../domain/subject.repository';
import { SubjectMapper } from './subject.mapper';
import { ForbiddenError } from '@/core/errors/app.error';
import type { ISubjectMemberProvider } from '../domain/providers/subject-member.provider';
import type { ISubjectAcademicYearProvider } from '../domain/providers/subject-academic-year.provider';

export class ListAllSubjectsUseCase {
  constructor(
    private readonly subjectRepository: ISubjectRepository,
    private readonly memberProvider: ISubjectMemberProvider,
    private readonly academicYearProvider: ISubjectAcademicYearProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    academicYearId?: string
  ): Promise<SubjectDTO[]> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role)
      throw new ForbiddenError('You do not have access to this organization');

    let includeSoftDeleted = false;
    if (academicYearId) {
      includeSoftDeleted =
        await this.academicYearProvider.shouldIncludeSoftDeleted(
          academicYearId
        );
    }

    const subjects = await this.subjectRepository.findAll(
      organizationId,
      includeSoftDeleted
    );
    return SubjectMapper.toDTOList(subjects);
  }
}
