import { IOrganizationRepository } from '../../../domain/repositories/organization.repository';
import { Organization } from '../../../domain/entities/organization.entity';
import { CreateOrganizationDTO, OrganizationDTO } from '@tfg-horarios/shared';

export class CreateOrganizationUseCase {
  constructor(
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async execute(dto: CreateOrganizationDTO): Promise<OrganizationDTO> {
    const organization = Organization.create({
      name: dto.name,
      periodType: dto.periodType,
      morningStart: dto.morningStart,
      morningEnd: dto.morningEnd,
      afternoonStart: dto.afternoonStart,
      afternoonEnd: dto.afternoonEnd,
      slotDurationMinutes: dto.slotDurationMinutes,
    });

    await this.organizationRepository.save(organization);

    return {
      id: organization.id,
      name: organization.name,
      periodType: organization.periodType,
      morningStart: organization.morningStart,
      morningEnd: organization.morningEnd,
      afternoonStart: organization.afternoonStart,
      afternoonEnd: organization.afternoonEnd,
      slotDurationMinutes: organization.slotDurationMinutes,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString(),
    };
  }
}
