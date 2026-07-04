import type {
  SubjectDTO,
  SubjectListQueryDTO,
  PaginatedResponse,
} from '@tfg-horarios/shared';
import type { ISubjectRepository } from '../domain/subject.repository';
import { SubjectMapper } from './subject.mapper';
import { ForbiddenError } from '@/core/errors/app.error';
import type { IMemberProvider } from '../domain/providers/member.provider';

export class ListSubjectUseCase {
  constructor(
    private readonly subjectRepository: ISubjectRepository,
    private readonly memberProvider: IMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    filters?: SubjectListQueryDTO
  ): Promise<PaginatedResponse<SubjectDTO>> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role)
      throw new ForbiddenError('You do not have access to this organization');

    const { data, meta } = await this.subjectRepository.findPaginated(
      organizationId,
      filters
    );
    return {
      data: SubjectMapper.toDTOList(data),
      meta,
    };
  }
}
