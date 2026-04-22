import { OrganizationMember } from '../entities/organization-member.entity';

export interface IOrganizationMemberRepository {
  findById(id: string): Promise<OrganizationMember | null>;
  findByUserInOrganization(userId: string, organizationId: string): Promise<OrganizationMember | null>;
  findByUserId(userId: string): Promise<OrganizationMember[]>;
  findByOrganizationId(organizationId: string): Promise<OrganizationMember[]>;
  save(member: OrganizationMember): Promise<void>;
  delete(id: string): Promise<void>;
}
