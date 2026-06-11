import type { IOrganizationRepository } from '@/modules/organization/domain/organization.repository';
import type { IAcademicYearOrganizationProvider } from '../../domain/academic-year-organization.provider';

export class AcademicYearOrganizationAdapter implements IAcademicYearOrganizationProvider {
  constructor(
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async organizationExists(organizationId: string): Promise<boolean> {
    const organization =
      await this.organizationRepository.findById(organizationId);
    return !!organization;
  }
}
