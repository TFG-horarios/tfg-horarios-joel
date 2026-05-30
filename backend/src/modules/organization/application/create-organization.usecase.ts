import { type IOrganizationRepository } from '../domain/organization.repository';
import { Organization } from '../domain/organization.entity';
import {
  type SaveOrganizationDTO,
  type OrganizationDTO,
} from '@tfg-horarios/shared';
import { OrganizationMapper } from './organization.mapper';

export class CreateOrganizationUseCase {
  constructor(
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async execute(
    dto: SaveOrganizationDTO,
    userId: string
  ): Promise<OrganizationDTO> {
    const organization = Organization.create({
      name: dto.name,
      periodType: dto.periodType,
      morningStart: dto.morningStart,
      morningEnd: dto.morningEnd,
      afternoonStart: dto.afternoonStart,
      afternoonEnd: dto.afternoonEnd,
      slotDurationMinutes: dto.slotDurationMinutes,
    });

    await this.organizationRepository.create(organization, userId);

    return OrganizationMapper.toDTO(organization);
  }
}
