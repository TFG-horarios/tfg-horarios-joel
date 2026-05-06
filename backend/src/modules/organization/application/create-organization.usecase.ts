import { type IOrganizationRepository } from '../domain/organization.repository';
import { type IOrganizationMemberRepository } from '../../organization-member/domain/organization-member.repository';
import { Organization } from '../domain/organization.entity';
import { OrganizationMember } from '../../organization-member/domain/organization-member.entity';
import {
  type CreateOrganizationDTO,
  type OrganizationDTO,
} from '@tfg-horarios/shared';
import { OrganizationMapper } from './organization.mapper';

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

    return OrganizationMapper.toDTO(organization);
  }
}
