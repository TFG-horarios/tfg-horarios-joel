import type { DegreeDTO } from '@tfg-horarios/shared';
import type { IDegreeRepository } from '../domain/degree.repository';
import type { IDegreeMemberProvider } from '../domain/degree-member.provider';
import type { AppRole } from '@/core/permissions/roles';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { DegreeMapper } from './degree.mapper';

export class GetDegreeUseCase {
  constructor(
    private readonly degreeRepository: IDegreeRepository,
    private readonly memberProvider: IDegreeMemberProvider
  ) {}

  async execute(
    organizationId: string,
    degreeId: string,
    requesterUserId: string
  ): Promise<DegreeDTO> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    const degree = await this.degreeRepository.findById(
      degreeId,
      organizationId
    );
    if (!degree) throw new NotFoundError('Degree', degreeId);

    return DegreeMapper.toDTO(degree);
  }
}
