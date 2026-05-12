import type { ISubjectGroupRepository } from '../domain/subject-group.repository';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import type {
  SaveSubjectGroupDTO,
  SubjectGroupDTO,
} from '@tfg-horarios/shared';
import { SubjectGroup } from '../domain/subject-group.entity';
import { SubjectGroupMapper } from './subject-group.mapper';
import { ForbiddenError, ValidationError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';

export class BulkCreateSubjectGroupUseCase {
  constructor(
    private readonly subjectGroupRepository: ISubjectGroupRepository,
    private readonly memberRepository: IMemberRepository
  ) {}

  async execute(
    organizationId: string,
    subjectId: string,
    requesterUserId: string,
    dtos: SaveSubjectGroupDTO[]
  ): Promise<SubjectGroupDTO[]> {
    if (!dtos || dtos.length === 0) {
      throw new ValidationError('No data provided for bulk creation');
    }

    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (
      !requester ||
      !hasPermission(requester.role, 'CREATE_ORGANIZATION_COMPONENTS')
    ) {
      throw new ForbiddenError(
        'You do not have permission to create groups in this organization.'
      );
    }

    const groups = dtos.map((dto) =>
      SubjectGroup.create({
        organizationId,
        subjectId,
        name: dto.name,
        groupType: dto.groupType,
        shift: dto.shift,
        groupNumber: dto.groupNumber,
        weeklyHours: dto.weeklyHours,
        numberOfStudents: dto.numberOfStudents,
      })
    );

    await this.subjectGroupRepository.createMany(groups);
    return SubjectGroupMapper.toDTOList(groups);
  }
}
