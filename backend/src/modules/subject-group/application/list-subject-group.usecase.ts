import type { ISubjectGroupRepository } from '../domain/subject-group.repository';
import type { IMemberProvider } from '../domain/providers/member.provider';
import type {
  SubjectGroupDTO,
  SubjectGroupListQueryDTO,
  PaginatedResponse,
} from '@tfg-horarios/shared';
import { SubjectGroupMapper } from './subject-group.mapper';
import { ForbiddenError } from '@/core/errors/app.error';

export class ListSubjectGroupsUseCase {
  constructor(
    private readonly subjectGroupRepository: ISubjectGroupRepository,
    private readonly memberProvider: IMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    filters?: SubjectGroupListQueryDTO
  ): Promise<PaginatedResponse<SubjectGroupDTO>> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization.');
    }

    const { data, meta } = await this.subjectGroupRepository.findPaginated(
      organizationId,
      filters
    );
    return {
      data: SubjectGroupMapper.toDTOList(data),
      meta,
    };
  }
}
