import type { DegreeDTO } from '@tfg-horarios/shared';
import type { IDegreeRepository } from '../domain/degree.repository';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { DegreeMapper } from './degree.mapper';

export class GetDegreeUseCase {
  constructor(
    private readonly degreeRepository: IDegreeRepository,
    private readonly memberRepository: IMemberRepository
  ) {}

  async execute(
    organizationId: string,
    degreeId: string,
    requesterUserId: string
  ): Promise<DegreeDTO> {
    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (!requester)
      throw new ForbiddenError('You do not have access to this organization');

    const degree = await this.degreeRepository.findById(degreeId);
    if (!degree || degree.organizationId !== organizationId)
      throw new NotFoundError('Degree', degreeId);

    return DegreeMapper.toDTO(degree);
  }
}
