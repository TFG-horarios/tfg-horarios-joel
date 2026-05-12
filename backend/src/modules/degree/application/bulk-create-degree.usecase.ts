import type { DegreeDTO, SaveDegreeDTO } from '@tfg-horarios/shared';
import { Degree } from '../domain/degree.entity';
import type { IDegreeRepository } from '../domain/degree.repository';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { ForbiddenError, ValidationError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { DegreeMapper } from './degree.mapper';

export class BulkCreateDegreesUseCase {
  constructor(
    private readonly degreeRepository: IDegreeRepository,
    private readonly memberRepository: IMemberRepository
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    dtos: SaveDegreeDTO[]
  ): Promise<DegreeDTO[]> {
    if (!dtos || dtos.length === 0)
      throw new ValidationError('La lista de grados no puede estar vacía');

    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (
      !requester ||
      !hasPermission(requester.role, 'CREATE_ORGANIZATION_COMPONENTS')
    ) {
      throw new ForbiddenError(
        'You do not have permission to perform this action'
      );
    }

    const degrees = dtos.map((dto) =>
      Degree.create({
        organizationId,
        name: dto.name,
        code: dto.code,
      })
    );

    await this.degreeRepository.createMany(degrees);
    return DegreeMapper.toDTOList(degrees);
  }
}
