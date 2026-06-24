import type { DegreeDTO, SaveDegreeDTO } from '@tfg-horarios/shared';
import { Degree } from '../domain/degree.entity';
import type { IDegreeRepository } from '../domain/degree.repository';
import type { IDegreeMemberProvider } from '../domain/providers/degree-member.provider';
import type { AppRole } from '@/core/permissions/roles';
import { ForbiddenError, ValidationError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { DegreeMapper } from './degree.mapper';

export class ReplaceDegreesUseCase {
  constructor(
    private readonly degreeRepository: IDegreeRepository,
    private readonly memberProvider: IDegreeMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    dtos: SaveDegreeDTO[]
  ): Promise<DegreeDTO[]> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (
      !role ||
      !hasPermission(role, 'DELETE_ORGANIZATION_COMPONENTS') ||
      !hasPermission(role, 'CREATE_ORGANIZATION_COMPONENTS')
    ) {
      throw new ForbiddenError(
        'You do not have permission to replace degrees in this organization'
      );
    }

    const uniqueNames = new Set<string>();
    const uniqueCodes = new Set<string>();
    for (const dto of dtos) {
      const name = dto.name.trim();
      const code = dto.code.trim();
      if (uniqueNames.has(name) || uniqueCodes.has(code)) {
        throw new ValidationError(
          `Duplicate degree name or code in request: ${name} / ${code}`
        );
      }
      uniqueNames.add(name);
      uniqueCodes.add(code);
    }

    const degrees = dtos.map((dto) =>
      Degree.create({
        organizationId,
        name: dto.name,
        code: dto.code,
      })
    );

    await this.degreeRepository.replace(degrees, organizationId);
    return DegreeMapper.toDTOList(degrees);
  }
}
