import type { ISubjectGroupRepository } from '../domain/subject-group.repository';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import type {
  SaveSubjectGroupDTO,
  SubjectGroupDTO,
} from '@tfg-horarios/shared';
import { SubjectGroup } from '../domain/subject-group.entity';
import { SubjectGroupMapper } from './subject-group.mapper';
import { ForbiddenError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';

export class CreateSubjectGroupUseCase {
  constructor(
    private readonly subjectGroupRepository: ISubjectGroupRepository,
    private readonly memberRepository: IMemberRepository
  ) {}

  async execute(
    organizationId: string,
    subjectId: string,
    requesterUserId: string,
    dto: SaveSubjectGroupDTO
  ): Promise<SubjectGroupDTO> {
    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (
      !requester ||
      !hasPermission(requester.role, 'CREATE_ORGANIZATION_COMPONENTS')
    ) {
      throw new ForbiddenError(
        'You do not have permission to create a group in this organization.'
      );
    }

    const subjectGroup = SubjectGroup.create({
      organizationId,
      subjectId,
      name: dto.name,
      groupType: dto.groupType,
      shift: dto.shift,
      groupNumber: dto.groupNumber,
      weeklyHours: dto.weeklyHours,
      numberOfStudents: dto.numberOfStudents,
    });

    await this.subjectGroupRepository.create(subjectGroup);
    return SubjectGroupMapper.toDTO(subjectGroup);
  }
}
