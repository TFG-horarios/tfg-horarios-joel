import type { IDegreeRepository } from '../domain/degree.repository';
import type { IDegreeMemberProvider } from '../domain/providers/degree-member.provider';
import { ForbiddenError } from '@/core/errors/app.error';
import type { AppRole } from '@/core/permissions/roles';
import type { DegreeIdentifierDTO } from '@tfg-horarios/shared';

export class GetDegreeIdentifiersUseCase {
  constructor(
    private readonly degreeRepository: IDegreeRepository,
    private readonly memberProvider: IDegreeMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string
  ): Promise<DegreeIdentifierDTO[]> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    return this.degreeRepository.findIdentifiers(organizationId);
  }
}
