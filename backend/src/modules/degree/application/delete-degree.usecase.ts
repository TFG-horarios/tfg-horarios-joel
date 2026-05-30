import type { IDegreeRepository } from '../domain/degree.repository';
import type { IDegreeMemberProvider } from '../domain/degree-member.provider';
import type { AppRole } from '@/core/permissions/roles';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';

export class DeleteDegreeUseCase {
  constructor(
    private readonly degreeRepository: IDegreeRepository,
    private readonly memberProvider: IDegreeMemberProvider
  ) {}

  async execute(
    organizationId: string,
    degreeId: string,
    requesterUserId: string
  ): Promise<void> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'DELETE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to delete degrees in this organization.'
      );
    }

    const degree = await this.degreeRepository.findById(
      degreeId,
      organizationId
    );
    if (!degree) throw new NotFoundError('Degree', degreeId);

    await this.degreeRepository.delete(degreeId, organizationId);
  }
}
