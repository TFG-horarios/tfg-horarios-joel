import { IOrganizationRepository } from '../../../domain/repositories/organization.repository';
import { OrganizationDTO } from '@tfg-horarios/shared';

export class ListOrganizationsUseCase {
  constructor(
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async execute(): Promise<OrganizationDTO[]> {
    const organizations = await this.organizationRepository.findAll();

    return organizations.map((org) => ({
      id: org.id,
      name: org.name,
      periodType: org.periodType,
      morningStart: org.morningStart,
      morningEnd: org.morningEnd,
      afternoonStart: org.afternoonStart,
      afternoonEnd: org.afternoonEnd,
      slotDurationMinutes: org.slotDurationMinutes,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    }));
  }
}
