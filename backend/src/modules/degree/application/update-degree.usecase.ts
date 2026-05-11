import type { DegreeDTO, CreateAndUpdateDegreeDTO } from '@tfg-horarios/shared';
import type { IDegreeRepository } from '../domain/degree.repository';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { DegreeMapper } from './degree.mapper';

export class UpdateDegreeUseCase {
  constructor(
    private readonly degreeRepository: IDegreeRepository,
    private readonly memberRepository: IMemberRepository
  ) {}

  async execute(
    organizationId: string,
    degreeId: string,
    requesterUserId: string,
    dto: CreateAndUpdateDegreeDTO
  ): Promise<DegreeDTO> {
    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (
      !requester ||
      !hasPermission(requester.role, 'UPDATE_ORGANIZATION_COMPONENTS')
    ) {
      throw new ForbiddenError(
        'You do not have permission to update degrees in this organization.'
      );
    }

    const degree = await this.degreeRepository.findById(degreeId);
    if (!degree || degree.organizationId !== organizationId)
      throw new NotFoundError('Degree', degreeId);

    degree.update(dto.name, dto.code);
    await this.degreeRepository.update(degree);
    return DegreeMapper.toDTO(degree);
  }
}
