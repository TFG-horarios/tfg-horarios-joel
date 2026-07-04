import type { DegreeDTO, SaveDegreeDTO } from '@tfg-horarios/shared';
import type { IDegreeRepository } from '../domain/degree.repository';
import type { IMemberProvider } from '../domain/providers/member.provider';
import type { AppRole } from '@/core/permissions/roles';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { DegreeMapper } from './degree.mapper';

export class UpdateDegreeUseCase {
  constructor(
    private readonly degreeRepository: IDegreeRepository,
    private readonly memberProvider: IMemberProvider
  ) {}

  async execute(
    organizationId: string,
    degreeId: string,
    requesterUserId: string,
    dto: SaveDegreeDTO
  ): Promise<DegreeDTO> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'UPDATE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to update degrees in this organization.'
      );
    }

    const degree = await this.degreeRepository.findById(
      degreeId,
      organizationId,
      false
    );
    if (!degree) throw new NotFoundError('Degree', degreeId);

    degree.update(dto.name, dto.code);
    await this.degreeRepository.update(degree);
    return DegreeMapper.toDTO(degree);
  }
}
