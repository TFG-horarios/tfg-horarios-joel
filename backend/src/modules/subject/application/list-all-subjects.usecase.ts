import type { SubjectDTO } from '@tfg-horarios/shared';
import type { ISubjectRepository } from '../domain/subject.repository';
import { SubjectMapper } from './subject.mapper';
import { ForbiddenError } from '@/core/errors/app.error';
import type { IMemberProvider } from '../domain/providers/member.provider';
import type { IAcademicYearProvider } from '../domain/providers/academic-year.provider';

export class ListAllSubjectsUseCase {
  constructor(
    private readonly subjectRepository: ISubjectRepository,
    private readonly memberProvider: IMemberProvider,
    private readonly academicYearProvider: IAcademicYearProvider
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
