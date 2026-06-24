import type { ISubjectGroupRepository } from '../domain/subject-group.repository';
import type { ISubjectGroupMemberProvider } from '../domain/providers/subject-group-member.provider';
import type { SubjectGroupDTO } from '@tfg-horarios/shared';
import { SubjectGroupMapper } from './subject-group.mapper';
import { ForbiddenError } from '@/core/errors/app.error';
import type { ISubjectGroupAcademicYearProvider } from '../domain/providers/subject-group-academic-year.provider';

export class ListAllSubjectGroupsUseCase {
  constructor(
    private readonly subjectGroupRepository: ISubjectGroupRepository,
    private readonly memberProvider: ISubjectGroupMemberProvider,
    private readonly academicYearProvider: ISubjectGroupAcademicYearProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    academicYearId?: string
  ): Promise<SubjectGroupDTO[]> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization.');
    }

    let includeSoftDeleted = false;
    if (academicYearId) {
      includeSoftDeleted =
        await this.academicYearProvider.shouldIncludeSoftDeleted(
          academicYearId
        );
    }
    const groups = await this.subjectGroupRepository.findAll(
      organizationId,
      includeSoftDeleted
    );
    return SubjectGroupMapper.toDTOList(groups);
  }
}
