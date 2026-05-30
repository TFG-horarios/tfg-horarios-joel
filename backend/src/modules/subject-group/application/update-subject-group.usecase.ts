import type { ISubjectGroupRepository } from '../domain/subject-group.repository';
import type { ISubjectGroupMemberProvider } from '../domain/subject-group-member.provider';
import type {
  SaveSubjectGroupDTO,
  SubjectGroupDTO,
} from '@tfg-horarios/shared';
import { SubjectGroupMapper } from './subject-group.mapper';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { ISubjectProvider } from '../domain/subject.provider';

export class UpdateSubjectGroupUseCase {
  constructor(
    private readonly subjectGroupRepository: ISubjectGroupRepository,
    private readonly subjectProvider: ISubjectProvider,
    private readonly memberProvider: ISubjectGroupMemberProvider
  ) {}

  async execute(
    organizationId: string,
    id: string,
    requesterUserId: string,
    dto: SaveSubjectGroupDTO
  ): Promise<SubjectGroupDTO> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'UPDATE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to update groups in this organization.'
      );
    }

    const group = await this.subjectGroupRepository.findById(
      id,
      organizationId
    );

    if (!group) {
      throw new NotFoundError('SubjectGroup', id);
    }

    const availableShifts = await this.subjectProvider.getAvailableShifts(
      group.subjectId,
      organizationId
    );
    if (!availableShifts) {
      throw new NotFoundError('Subject', group.subjectId);
    }

    if (!availableShifts.includes(dto.shift)) {
      throw new ValidationError(
        `Shift ${dto.shift} is not available for this subject.`
      );
    }

    group.update({
      name: dto.name,
      groupType: dto.groupType,
      shift: dto.shift,
      groupNumber: dto.groupNumber,
      weeklyHours: dto.weeklyHours,
      numberOfStudents: dto.numberOfStudents,
    });

    await this.subjectGroupRepository.update(group);

    return SubjectGroupMapper.toDTO(group);
  }
}
