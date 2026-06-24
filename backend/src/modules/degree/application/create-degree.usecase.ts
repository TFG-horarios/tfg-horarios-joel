import type { DegreeDTO, SaveDegreeDTO } from '@tfg-horarios/shared';
import { Degree } from '../domain/degree.entity';
import type { IDegreeRepository } from '../domain/degree.repository';
import type { IDegreeMemberProvider } from '../domain/providers/degree-member.provider';
import type { AppRole } from '@/core/permissions/roles';
import { ForbiddenError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { DegreeMapper } from './degree.mapper';

export class CreateDegreeUseCase {
  constructor(
    private readonly degreeRepository: IDegreeRepository,
    private readonly memberProvider: IDegreeMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    dto: SaveDegreeDTO
  ): Promise<DegreeDTO> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'CREATE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to create a degree in this organization.'
      );
    }

    const degree = Degree.create({
      organizationId,
      name: dto.name,
      code: dto.code,
    });

    await this.degreeRepository.create(degree);
    return DegreeMapper.toDTO(degree);
  }
}
