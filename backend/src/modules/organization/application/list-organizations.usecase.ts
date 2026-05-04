import { type IOrganizationRepository } from '../domain/organization.repository.interface';
import { type IOrganizationMemberRepository } from '../domain/organization-member.repository.interface';
import { type OrganizationDTO } from '@tfg-horarios/shared';

export class ListOrganizationsUseCase {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
    private readonly organizationMemberRepository: IOrganizationMemberRepository
  ) {}

  async execute(userId: string): Promise<OrganizationDTO[]> {
    const memberships =
      await this.organizationMemberRepository.findByUserId(userId);

    const organizations = await Promise.all(
      memberships.map(async (membership) => {
        return await this.organizationRepository.findById(
          membership.organizationId
        );
      })
    );

    const userOrganizations = organizations.filter((org) => org !== null);

    return userOrganizations.map((org) => ({
      id: org.id,
      name: org.name,
      periodType: org.periodType,
      morningStart: org.morningStart.slice(0, 5),
      morningEnd: org.morningEnd.slice(0, 5),
      afternoonStart: org.afternoonStart.slice(0, 5),
      afternoonEnd: org.afternoonEnd.slice(0, 5),
      slotDurationMinutes: org.slotDurationMinutes,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    }));
  }
}
