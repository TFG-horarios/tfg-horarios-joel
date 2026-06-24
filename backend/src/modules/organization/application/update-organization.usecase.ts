import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { type IOrganizationRepository } from '../domain/organization.repository';
import type { IOrganizationMemberProvider } from '../domain/providers/organization-member.provider';
import { hasPermission } from '@/core/permissions/authorization';
import { OrganizationMapper } from './organization.mapper';
import {
  type SaveOrganizationDTO,
  type OrganizationDTO,
} from '@tfg-horarios/shared';

export class UpdateOrganizationUseCase {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
    private readonly memberProvider: IOrganizationMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    dto: SaveOrganizationDTO
  ): Promise<OrganizationDTO> {
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
        'You do not have permission to update this organization'
      );
    }

    org.update({ name: dto.name });

    await this.organizationRepository.update(org);
    return OrganizationMapper.toDTO(org);
  }
}
