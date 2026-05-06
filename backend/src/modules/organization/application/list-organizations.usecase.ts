import { type IOrganizationRepository } from '../domain/organization.repository';
import { type OrganizationDTO } from '@tfg-horarios/shared';
import { OrganizationMapper } from './organization.mapper';

export class ListOrganizationsUseCase {
  constructor(
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async execute(userId: string): Promise<OrganizationDTO[]> {
    const organizations =
      await this.organizationRepository.findByUserId(userId);
    return OrganizationMapper.toDTOList(organizations);
  }
}
