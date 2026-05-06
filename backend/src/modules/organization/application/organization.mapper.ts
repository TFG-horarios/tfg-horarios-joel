import { Organization } from '../domain/organization.entity';
import { type OrganizationDTO } from '@tfg-horarios/shared';

export class OrganizationMapper {
  static toDTO(org: Organization): OrganizationDTO {
    return {
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
    };
  }

  static toDTOList(organizations: Organization[]): OrganizationDTO[] {
    return organizations.map((org) => this.toDTO(org));
  }
}
