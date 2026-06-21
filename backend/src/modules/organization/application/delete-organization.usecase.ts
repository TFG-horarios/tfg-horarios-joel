import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { type IOrganizationRepository } from '../domain/organization.repository';
import type { IOrganizationMemberProvider } from '../domain/organization-member.provider';
import { hasPermission } from '@/core/permissions/authorization';

export class DeleteOrganizationUseCase {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
    private readonly memberProvider: IOrganizationMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string
  ): Promise<void> {
    const org = await this.organizationRepository.findById(organizationId);
    if (!org) {
      throw new NotFoundError('Organization', organizationId);
    }

    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'MANAGE_ORGANIZATION')) {
      throw new ForbiddenError(
        'You can not delete this organization. Only administrators can do it.'
      );
    }

    await this.organizationRepository.delete(organizationId);
  }
}
