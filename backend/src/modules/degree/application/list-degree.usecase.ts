import type {
  DegreeDTO,
  DegreeListQueryDTO,
  PaginatedResponse,
} from '@tfg-horarios/shared';
import type { IDegreeRepository } from '../domain/degree.repository';
import type { IMemberProvider } from '../domain/providers/member.provider';
import type { AppRole } from '@/core/permissions/roles';
import { ForbiddenError } from '@/core/errors/app.error';
import { DegreeMapper } from './degree.mapper';

export class ListDegreesUseCase {
  constructor(
    private readonly degreeRepository: IDegreeRepository,
    private readonly memberProvider: IMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    filters?: DegreeListQueryDTO
  ): Promise<PaginatedResponse<DegreeDTO>> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    const { data, meta } = await this.degreeRepository.findPaginated(
      organizationId,
      filters
    );
    return {
      data: DegreeMapper.toDTOList(data),
      meta,
    };
  }
}
