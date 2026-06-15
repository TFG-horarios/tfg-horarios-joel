import { Organization } from '../domain/organization.entity';
import { type OrganizationDTO } from '@tfg-horarios/shared';

export class OrganizationMapper {
  static toDTO(org: Organization): OrganizationDTO {
    return {
      id: org.id,
      name: org.name,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    };
  }

  static toDTOList(organizations: Organization[]): OrganizationDTO[] {
    return organizations.map((org) => this.toDTO(org));
  }
}
