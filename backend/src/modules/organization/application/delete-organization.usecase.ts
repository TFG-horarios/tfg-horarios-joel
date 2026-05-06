import { ForbiddenError, NotFoundError } from 'src/core/errors/app.error';
import { type IOrganizationRepository } from '../domain/organization.repository';
import type { IOrganizationMemberRepository } from 'src/modules/organization-member/domain/organization-member.repository';
import { hasPermission, PERMISSIONS } from '../domain/roles';

export class DeleteOrganizationUseCase {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
    private readonly organizationMemberRepository: IOrganizationMemberRepository
  ) {}

  async execute(organizationId: string, userId: string): Promise<void> {
    const org = await this.organizationRepository.findById(organizationId);
    if (!org) {
      throw new NotFoundError('Organization', organizationId);
    }

    const membership = await this.organizationMemberRepository.findByUserAndOrg(
      userId,
      organizationId
    );
    if (
      !membership ||
      !hasPermission(membership.role, PERMISSIONS.DELETE_ORGANIZATION)
    ) {
      throw new ForbiddenError(
        'You can not delete this organization. Only administrators can do it.'
      );
    }

    await this.organizationRepository.delete(organizationId);
  }
}
