import { type IOrganizationRepository } from '../domain/organization.repository.interface';
import { type IOrganizationMemberRepository } from '../domain/organization-member.repository.interface';
import { Organization } from '../domain/organization.entity';
import { OrganizationMember } from '../domain/organization-member.entity';
import {
  type CreateOrganizationDTO,
  type OrganizationDTO,
} from '@tfg-horarios/shared';

export class CreateOrganizationUseCase {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
    private readonly organizationMemberRepository: IOrganizationMemberRepository
  ) {}

  async execute(
    dto: CreateOrganizationDTO,
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

    const adminMember = OrganizationMember.create({
      organizationId: organization.id,
      userId,
      role: 'admin',
    });

    await this.organizationRepository.save(organization);
    await this.organizationMemberRepository.save(adminMember);

    return {
      id: organization.id,
      name: organization.name,
      periodType: organization.periodType,
      morningStart: organization.morningStart.slice(0, 5),
      morningEnd: organization.morningEnd.slice(0, 5),
      afternoonStart: organization.afternoonStart.slice(0, 5),
      afternoonEnd: organization.afternoonEnd.slice(0, 5),
      slotDurationMinutes: organization.slotDurationMinutes,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString(),
    };
  }
}
