import type { DegreeDTO } from '@tfg-horarios/shared';
import type { IDegreeRepository } from '../domain/degree.repository';
import type { IDegreeMemberProvider } from '../domain/degree-member.provider';
import { ForbiddenError } from '@/core/errors/app.error';
import { DegreeMapper } from './degree.mapper';
import type { AppRole } from '@/core/permissions/roles';

export class ListAllDegreesUseCase {
  constructor(
    private readonly degreeRepository: IDegreeRepository,
    private readonly memberProvider: IDegreeMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string
  ): Promise<DegreeDTO[]> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    const degrees = await this.degreeRepository.findAll(organizationId);
    return DegreeMapper.toDTOList(degrees);
  }
}
