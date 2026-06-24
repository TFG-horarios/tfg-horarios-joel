import type { IOrganizationRepository } from '@/modules/organization/domain/organization.repository';
import type { IOrganizationProvider } from '../../domain/providers/organization.provider';

export class OrganizationAdapter implements IOrganizationProvider {
  constructor(
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async organizationExists(organizationId: string): Promise<boolean> {
    const organization =
      await this.organizationRepository.findById(organizationId);
    return !!organization;
  }
}
